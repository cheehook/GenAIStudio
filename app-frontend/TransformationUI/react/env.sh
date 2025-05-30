#!/bin/sh
# Copyright (C) 2024 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

for i in $(env | grep APP_) #// Make sure to use the prefix MY_APP_ if you have any other prefix in env.production file variable name replace it with MY_APP_
do
    key=$(echo $i | cut -d '=' -f 1)
    value=$(echo $i | cut -d '=' -f 2-)
    new_key="APP_${key#APP_}"
    echo "Processing: $key -> $new_key=$value"
    # sed All files
    # find /usr/share/nginx/html -type f -exec sed -i "s|${key}|${value}|g" '{}' +

    # sed JS and CSS only
    find /usr/share/nginx/html -type f \( -name '*.js' -o -name '*.css' \) | while read -r file; do
        # Check if the key exists in the file
        if grep -q "$new_key" "$file"; then
            echo "Found $new_key in $file"
            # Perform the replacement and log changed lines
            sed -n "/$new_key/{s|$new_key|$value|g;p}" "$file" > temp_output
            if [ -s temp_output ]; then
                echo "Replaced in $file:"
                cat temp_output
                # Apply the replacement
                sed -i "s|$new_key|$value|g" "$file"
                echo "Successfully replaced $new_key with $value in $file"
            else
                echo "No replacements made for $new_key in $file"
            fi
        else
            echo "$new_key not found in $file"
        fi
    done
done
