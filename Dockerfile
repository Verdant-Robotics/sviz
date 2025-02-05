# Build stage
FROM node:16 as build
WORKDIR /src
COPY . ./

RUN corepack enable
RUN yarn install --immutable

RUN yarn run web:build:prod

# Release stage
FROM caddy:2.9.1-alpine
WORKDIR /app
COPY --from=build /src/web/.webpack ./

EXPOSE 80 443

# Configure Caddy with HTTP to HTTPS redirect and TLS
COPY <<EOF /etc/caddy/Caddyfile
:80 {
    redir https://{env.ROBOT_NAME}.{env.DOMAIN_NAME}{uri} permanent
}

{env.ROBOT_NAME}.{env.DOMAIN_NAME} {
    tls /etc/ssl/cert.crt /etc/ssl/cert.key
    root * /app
    file_server
}
EOF

COPY <<EOF /entrypoint.sh
# Optionally override the default layout with one provided via bind mount
mkdir -p /foxglove
touch /foxglove/default-layout.json
index_html=\$(cat index.html)
replace_pattern='/*FOXGLOVE_STUDIO_DEFAULT_LAYOUT_PLACEHOLDER*/'
replace_value=\$(cat /foxglove/default-layout.json)
echo "\${index_html/"\$replace_pattern"/\$replace_value}" > index.html

# Optionally set the extensions manifest via bind mount
if [ -f /app/extensions/manifest.json ]; then
  index_html=\$(cat index.html)
  extensions_json=\$(cat /app/extensions/manifest.json)
  replace_pattern='/*FOXGLOVE_STUDIO_EXTENSIONS_PLACEHOLDER*/'
  echo "\${index_html/"\$replace_pattern"/\$extensions_json}" > index.html
fi

# Continue executing the CMD
exec "\$@"
EOF

ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
