#!/bin/bash

rm -rf ./version

mkdir version

zip -r ./version/version.zip css/* images/* App/* fonts/* 440x280.png 440x280_2.png\
 440x280_3.png icon_128.png if__Select_Webpage_1153753.png if_Tabs_342927.png\
  *.html main.js manifest.json README.md Screenshot.png
