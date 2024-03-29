// server.js
import express from "express";
import sindri from "sindri";
import { genCircomAllstr } from "./gen_circom.js";
import { applyMinDfa, regexToDfa } from "./regex.js";
import fs from "fs";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 4000;

let minDfa = [];
let reveals = [[]];
let circom = "";
const MONGO_URI = process.env.MONGO_URL || "";

let db;
let formId = 1;
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

async function saveFormAndCircuit(circuitId, walletAdd) {
  try {
    formId = formId + 1;
    console.log("Form ID:", formId);
    const result = await db.collection("feedbacks").insertOne({
      form_id: formId,
      walletAddress: walletAdd,
      circuit_id: circuitId,
      feedback: [],
    });
    console.log("Form and circuit saved:", result);

    const createdObject = {
      form_id: formId,
      walletAddress: walletAdd,
      circuit_id: circuitId,
    };
    console.log("Created Object:", createdObject);
    return createdObject;
  } catch (error) {
    console.log("Error saving form and circuit:", error);
    throw error;
  }
}

app.post("/circuit_id", async (req, res) => {
  try {
    const { regex, apiKey, walletAddress } = req.body;
    console.log(regex);
    console.log(apiKey);

    // Check if regex and apiKey are provided
    if (!regex || !apiKey || !walletAddress) {
      return res.status(400).send("Regex and apiKey are required.");
    }
    generate(regex); // Pass regex to the generate() function
    const client = await sindri.authorize({ apiKey });

    // Create circuit with the provided regex
    const circuit = await sindri.createCircuit("./circuits/");
    console.log(circuit);
    // Generate the circuit and retrieve circuit_id
    const createdObject = await saveFormAndCircuit(
      circuit.circuit_id,
      walletAddress
    );
    // const circuit = await generateCircuit(regex, apiKey);

    // Return the circuit_id
    console.log(circuit.circuit_id);
    res.send(createdObject);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/feedback", async (req, res) => {
  try {
    const { id, feedback } = req.body;
    console.log(id, feedback);
    if (!id || !feedback) {
      return res.status(400).send("ID and feedback are required.");
    }

    const result = await db
      .collection("feedbacks")
      .findOneAndUpdate({ circuit_id: id }, { $push: { feedback: feedback } });

    // if (!result || !result.value) {
    //   console.log(
    //     "Feedback not added. Document not found or update operation failed."
    //   );
    //   return res
    //     .status(404)
    //     .send(
    //       "Feedback not added. Document not found or update operation failed."
    //     );
    // }
    if (result) {
      res.send("Feedback added successfully");
    } else {
      res.status(500).send("NO Id found");
    }
    // console.log("Feedback added:", result.value);
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/feedbacks/:walletAddress", async (req, res) => {
  try {
    console.log("object");
    const { walletAddress } = req.params;
    const feedbacks = await db
      .collection("feedbacks")
      .find({ walletAddress })
      .toArray();

    if (feedbacks.length === 0) {
      return res
        .status(404)
        .send("No feedbacks found for the provided wallet address.");
    }

    res.json(feedbacks);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
