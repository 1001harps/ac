self.addEventListener("install", function (event) {
  console.log("sw installed");
});

self.addEventListener("fetch", (event) => {
  console.log("fetch event", event);

  const newResponse = fetch(event.request).then((response) => {
    const newHeaders = new Headers(response.headers);

    if (event.request.url.includes("/assets")) {
      newHeaders.append("Cross-Origin-Opener-Policy", "same-origin");
      newHeaders.append("Cross-Origin-Embedder-Policy", "require-corp");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  });

  event.respondWith(newResponse);
});
