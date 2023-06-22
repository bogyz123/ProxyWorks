
# Proxy Checking API

A Node/Express API for checking the validity of a proxy.



## Supported proxy types

 - HTTP
 - HTTPS
 - Socks4
 - Socks5


## Example

#### Check status of a HTTP proxy

```
  GET /checkProxy/?proxy=87.236.197.232:3128&type=http&timeout=5000
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `proxy` | `string` | **Required** The proxy itself |
| `type` | `string` | **Required** The proxy type |
| `timeout` | `string` | **Required** Time for proxy to respond in milliseconds |

#### Check a Socks5 proxy

```
  GET /checkProxy/?proxy=117.178.244.108:8123&type=socks5&timeout=5000
```
#### Example response

```
  {proxy: '87.236.197.232:3128', type:'socks5', status: 'Proxy connected successfully', country: 'United States', latency: 139}
```
| Key | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `proxy` | `string` | The proxy that's checked |
| `type` | `string` | Type of the proxy |
| `status` | `string` | Status of the request (302/redirect CAN be valid) |
| `country` | `string` | The country where the IP originates from |
| `latency` | `string` | The time (ms) which took the proxy to respond |


