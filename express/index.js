const express = require("express");
const {buildSchema, graphql} = require("graphql");
const fs = require("fs");
const path = require("path");
const app = express();
const typeDefs = fs.readFileSync(path.join(__dirname, "schema.gql"), "utf8");
const schema = buildSchema(typeDefs);
let messages = [];
const rootValue = {
  hello: () => "سلام به دوره ی گراف کیوال خوش آمدید",
  welcome: ({name}) => `سلام ${name} عزیز خوش آمدید`,
  sendMessage: ({input}) => {
    const newMessage = {
      id: messages.length + 1,
      text: input.text,
    };
    messages.push(newMessage);
    return newMessage;
  },
  messages: () => messages,
};
app.use(express.json());
app.use(express.urlencoded());
app.get("/graphiql", (req, res) => {
  const graphiQL = fs.readFileSync(
    path.join(__dirname, "graphiql.html"),
    "utf8"
  );
  res.setHeader("Content-Type", "text/html");
  res.send(graphiQL);
});
app.get("/graphql", (req, res) => {
  res.redirect("/graphiql");
});
app.post("/graphql", async (req, res) => {
  try {
    const {query, variables} = req.body;
    const result = await graphql({
      schema,
      source: query,
      rootValue,
      variableValues: variables,
    });
    return res.json(result);
  } catch (error) {
    res.status(500).json({errors: {message: error?.message}});
  }
});
app.listen(3000, () => {
  console.log("Graphql server running at http://localhost:3000/graphql");
});
