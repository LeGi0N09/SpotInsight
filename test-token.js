const token = "AQBfZ9-xqvg_im7Naev4t91b9v4zQlS3s4TXkNVqEHccTj-eQ-9Nopc-Xq_8zVw4rUAdtEsn9_QSoYLok8ysqk2EGuP9Tghll3V0nJXMzDXIKIiOJDKnzQaiCUJMQVjlL-RqL8SeYMUwcz2GYo09-OSixOcz1WwbN5KIkPznExT1eBq0emr55NGdtVwxQpKY-_k3HbM_bnfYE2IBGQCxo6lav1DJsjitssf7wDuaK9jnNvN_rPP0L4y4manbAKwDs6WQx4KJJ5SDo6SaFjijjlZ52JzredTUaA";

fetch("https://api.spotify.com/v1/me", {
  headers: {
    Authorization: `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => {
  console.log("✅ Token works! User:", data.display_name);
  console.log("Profile:", data);
})
.catch(err => {
  console.log("❌ Token failed:", err);
});
