# Images

```bash
mkdir -p small medium large

mogrify -path small -resize 640x480 -format jpg original/*.jpg
mogrify -path medium -resize 1280x720 -format jpg original/*.jpg
mogrify -path large -resize 1920x1080 -format jpg original/*.jpg
```
