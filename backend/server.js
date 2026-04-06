const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = require("./index");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
