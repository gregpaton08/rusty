# rusty

## Docker

```
docker run --rm -p 8080:80 -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro -v $(pwd):/usr/share/nginx/html:ro nginx
```

## nginx

```
brew install nginx
nginx -c ./nginx/nginx.conf -p ./
nginx -s stop -c ./nginx/nginx.conf -p ./
sudo nginx -s reload
```
