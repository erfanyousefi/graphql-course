const {readFileSync} = require("fs");
const {graphql} = require("graphql");
const {makeExecutableSchema} = require("@graphql-tools/schema");
const http = require("http");
const path = require("path");
const {users, posts} = require("./data");
const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/graphql") {
    const typeDefs = readFileSync(path.join(__dirname, "schema.gql"), "utf-8");
    const resolvers = {
      Query: {
        hello: () => "Hello GraphQL",
        users: (_, {role}) =>
          role ? users.filter((u) => u.role == role) : users,
        user: (_, {id}) => users.find((u) => u.id == id),
        posts: () => posts,
      },
      Mutation: {
        addUser: (_, {input}) => {
          const user = {
            id: users.length + 1,
            ...input,
          };
          users.push(user);
          return user;
        },
      },
      User: {
        posts: (user) => posts.filter((p) => p.author == user.id),
      },
      Post: {
        author: (post) => users.find((u) => u.id == post.author),
      },
    };
    const schema = makeExecutableSchema({typeDefs, resolvers});
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      //query, variables
      const {query, variable} = JSON.parse(body);
      const result = await graphql({
        schema,
        source: query,
        variableValues: variable,
        contextValue: {
          authorizedUser: {
            id: 1,
            name: "Erfan Usefi",
            email: "erfan@gmail.com",
          },
          headers: req.headers,
        },
      });
      console.log(result);
      res.writeHead(200, {"content-type": "application/json"});
      res.end(JSON.stringify(result));
    });
  } else {
    res.writeHead(404, {"content-type": "text/plain"});
    res.end("only post /graphql is accepted.");
  }
});

server.listen(5500, () => {
  console.log("graphql SDL-first is running => http://localhost:5500/graphql");
});

const query = {
  query: `query {
        hello, 
        users {
            name, 
            role, 
            age, 
            posts {title}
        }, 
        posts {
            id, 
            title, 
            author {id, name, role}
        }
    }`,
};
