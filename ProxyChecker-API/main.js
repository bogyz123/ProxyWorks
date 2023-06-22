const http = require('http');
const https = require("https");
const express = require('express');
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const { SocksClient } = require('socks');

app.get("/", (req, res) => {
  res.render("index");
});

app.use(express.static('./views'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));




app.get('/checkProxy', (req, res) => {
  const checker = new ProxyChecker();
  const { proxy, timeout, type } = req.query; // extract url query
  switch (type) {
    case "socks4": {
      checker.checkSocks4(proxy, timeout).then((result) => {
        res.json(result);
        console.log(result);
      }).catch((err) => {
        res.json(err);
      });
    }
      break;
    case "socks5": {
      checker.checkSocks5(proxy, timeout).then((result) => {
        res.json(result);
      }).catch((err) => {
        res.json(err);
      });
    }
      break;
    case "http": {
      checker.checkHttp(proxy, timeout).then((result) => {
        res.json(result);

      }).catch((err) => {
        res.json(err);
      });
    }
      break;
    case "https": {
      checker.checkHttps(proxy, timeout).then((result) => {
        res.json(result)
      }).catch((err) => {
        res.json(err)
      });

    }
      break;
  }

});
app.listen(5173, () => {
  console.log('Server started on port 5173');
});



class ProxyChecker {
  // A class that supports checking of HTTP, HTTPs, Socks4 and Socks5 proxy types. 

  checkHttp(proxy, timeout) {
    // HTTP Proxies can be used to fetch a webpage whose result can determine whether it's working or not
    const task = new Promise(async (resolve, reject) => {

      const options = this.initOptions(proxy, timeout, "http");
      const location = await this.getLocation(proxy.split(":")[0]);
      var latency = 0;
      const start = Date.now();
      const request = http.request(options);
      request.on("response", (res) => {
        const end = Date.now();
        latency = end - start;
        return resolve({ proxy: proxy, latency: latency, location: location, status: res.statusCode });
      });
      request.on("error", (err) => {
        return reject({ proxy: proxy, status: err.message });
      });
      request.on("timeout", () => {
        return reject({ proxy: proxy, status: 'The proxy has timed out.' });
      });


      request.end();


    });
    return task;
  }
  checkHttps(proxy, timeout) {

    const task = new Promise(async (resolve, reject) => {
      

      const options = this.initOptions(proxy, timeout, "https");
      const location = await this.getLocation(proxy.split(":")[0]);
      var latency = 0;
      const start = Date.now();
      const request = https.request(options);
      request.on("response", (res) => {
        const end = Date.now();
        latency = end - start;
        return resolve({ proxy: proxy, latency: latency, location: location, status: res.statusCode });
      });
      request.on("error", (err) => {
        return reject({ proxy: proxy, status: err.message });
      });
      request.on("timeout", () => {
        return reject({ proxy: proxy, status: 'The proxy has timed out.' });
      });


      request.end();


    });
    return task;
  }

  checkSocks4(proxy, timeout) {
    return new Promise(async (resolve, reject) => {
      try {
        const options = this.initOptions(proxy, timeout, "socks4");
        const location = await this.getLocation(proxy.split(":")[0]);
        var latency = 0;
        const startingOffset = Date.now();
        const client = new SocksClient(options);
        client.on("established", (e) => {
          
          const endingOffset = Date.now();
          latency = endingOffset - startingOffset;
          return resolve({ proxy: proxy, latency: latency, location: location, status: 'Proxy connected successfully.' });
        });
        client.on("error", (err) => {
          return reject({ proxy: proxy, status: err.message });
        });
        client.connect();
      }
      catch (error) {
        return reject({ proxy: proxy, status: error.message });
      }
    });
  }
  checkSocks5(proxy, timeout) {
    // Socks client can attempt to establish a stable connection between the proxy and endpoint which can determine whether the proxy works or not.
    return new Promise((resolve, reject) => {
      try {
        const options = this.initOptions(proxy, timeout, "socks5");
        var latency = 0;
        const location = this.getLocation(proxy.split(":")[0]);
        const startingOffset = Date.now();
        const client = new SocksClient(options);
        client.on("error", (err) => {
          client.destroy();
          return reject({ proxy: proxy, status: err.message });
        });
        client.on("established", (info) => {
          const endingOffset = Date.now();
          latency = endingOffset - startingOffset;
          client.destroy();
          return resolve({ proxy: proxy, latency: latency, location: location, status: "Proxy connected successfully." });
        });
        client.connect();
      }
      catch (error) {
        client.destroy();
        return reject({ proxy: proxy, status: error });
      }
    });
  }



  initOptions(proxy, timeout, proxyType) {
    // Function to type-check the proxy & timeout, returns full options required for fetch based on the proxy type (HTTPs options differ from Socket).
    if (proxy.split(":") === undefined) {
      return false;
    }
    const [ip, port] = proxy.split(":");
    const time = parseInt(timeout) || 5000;
    console.log("In options: " + "timeout: " + time + " | " + "host: " + ip + " | " + "port: " + port + " | path: " + 'example.com:' + proxyType);

    switch (proxyType) {
      case "http": return {
        method: 'GET',
        timeout: time,
        host: ip,
        port: parseInt(port),
        path: `http://example.com:80`
      }
      case "https": {
        return {
          method: 'GET',
          timeout: time,
          host: ip,
          port: parseInt(port),
          path: 'https://example.com:443'
        }
      }

      case "socks5":
        return {
          proxy: {
            host: ip,
            port: parseInt(port),
            type: 5,
            timeout: time
          },
          command: 'connect',
          destination: {
            host: 'www.google.com',
            port: 80
          }
        }
      case "socks4": {
        return {
          proxy: {
            host: ip,
            port: parseInt(port),
            type: 4,
            timeout: time
          },
          command: 'connect',
          destination: {
            host: '192.30.255.113',
            port: 80
          }
        }
      }

      default: return false;
    }
  }

  async getLocation(ip) {
    // Gets the location of the IP address (proxy)
    try {
      const apiCall = await fetch(`https://api.getgeoapi.com/v2/ip/${ip}?api_key=033d27ad3b1ef2ce73175e8d049316128424832b&format=json&filter=country&language=en`);
      const json = await apiCall.json();
      return json.country.name;
    }
    catch {
      return false;
    }
  }
}