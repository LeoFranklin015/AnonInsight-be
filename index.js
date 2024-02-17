// server.js
import express from "express";
import sindri from "sindri";
import { genCircomAllstr } from "./gen_circom.js";
import { applyMinDfa, regexToDfa } from "./regex.js";
import fs from "fs";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;

let minDfa = [];
let reveals = [[]];
let circom = "";
const MONGO_URI = process.env.MONGO_URL || "";

let db;
let formId = 0;
MongoClient.connect(MONGO_URI).then((client) => {
  db = client.db("AnonInsight"); // Now db can be used to write direct MongoDB queries
  console.log("MongoDB connected successfully");
});

function generate(re) {
  minDfa = regexToDfa(re);
  let r = reveals.map((r1) => r1.map((r2) => r2.split(",")));
  circom = genCircomAllstr(minDfa, "Test", r, re);
  const filePath = "./circuits/circuit.circom";
  fs.writeFileSync(filePath, circom);
  console.log("re writted");
}

async function saveFormAndCircuit(circuitId) {
  try {
    formId = formId + 1;
    await db.collection("feedbacks");
    const result = await db.collection("feedbacks").insertOne({
      form_id: formId,
      circuit_id: circuitId,
    });
    console.log("Form and circuit saved:", result);
  } finally {
    await client.close();
  }
}

app.post("/circuit_id", async (req, res) => {
  try {
    const { regex, apiKey } = req.body;
    console.log(regex);
    console.log(apiKey);

    // Check if regex and apiKey are provided
    if (!regex || !apiKey) {
      return res.status(400).send("Regex and apiKey are required.");
    }
    generate(regex); // Pass regex to the generate() function
    const client = await sindri.authorize({ apiKey });

    // Create circuit with the provided regex
    const circuit = await sindri.createCircuit("./circuits/");
    // Generate the circuit and retrieve circuit_id
    saveFormAndCircuit(circuit.circuit_id);
    // const circuit = await generateCircuit(regex, apiKey);

    // Return the circuit_id
    console.log(circuit.circuit_id);
    res.send({ circuit_id: circuit.circuit_id });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
