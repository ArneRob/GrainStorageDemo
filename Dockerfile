# Image of the demo of the warehouse app (lagerdemo): only the files the web server delivers, nothing that
# runs. It is never started - the server copies /site out of it into a
# folder Nginx serves (Server-Setup, "gss-deploy seite"). What is not
# delivered stays out through .dockerignore.
FROM scratch
COPY . /site
