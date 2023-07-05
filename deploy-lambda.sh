#!/usr/bin/env sh

cd $1
rm $1.zip
zip -r $1.zip .
aws lambda update-function-code --function-name $2 --zip-file fileb://$1.zip
