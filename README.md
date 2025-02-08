# rusty

## TODO

- [ ] https cert from letsencrypt
- [ ] automatically get new images from NextCloud or Google Photos
- [ ] remove geo location data from images
- [ ] auto resize new images
- [ ] host on NUC or in VPS
- [ ] hookup to domain name

## nginx

```
brew install nginx
nginx -c ./nginx/nginx.conf -p ./
nginx -s stop -c ./nginx/nginx.conf -p ./
sudo nginx -s reload
```

Or via Docker.

```bash
docker run --rm -p 8080:8080 -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro -v $(pwd)/frontend:/usr/share/nginx/html:ro -v $(pwd)/nginx/logs:/var/log/nginx/ --name nginx nginx
```
