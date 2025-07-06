FROM nginx:alpine

# Copy the frontend files to nginx html directory
COPY micro_frontend/ /usr/share/nginx/html/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 