document.getElementById("postForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const imageUrl = document.getElementById("photo").value.trim();
  const description = document.getElementById("description").value.trim();
  const location = document.getElementById("location").value.trim();

  try {
    const response = await fetch("http://localhost:3000/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, description, location })
    });

    if (response.ok) {
      alert("✅ Post added successfully!");
      document.getElementById("postForm").reset();
      window.location.href = "feed.html"; // Redirect after success
    } else {
      alert("⚠️ Failed to add post. Try again.");
    }
  } catch (error) {
    console.error("Error posting item:", error);
    alert("🚫 Server error. Please check connection.");
  }
});
