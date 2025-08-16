const form = document.getElementById("postForm");
const photoInput = document.getElementById("photo");
const preview = document.getElementById("preview");

const API_BASE = "https://campus-map-6cuk.onrender.com"; // ✅ Your backend

// ✅ Show image preview
photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }
});

// ✅ Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const description = document.getElementById("description").value.trim();
  const location = document.getElementById("location").value.trim();
  const file = photoInput.files[0];

  if (!file) {
    alert("📸 Please select a photo.");
    return;
  }

  if (!description || !location) {
    alert("📝 Please fill in all fields.");
    return;
  }

  const formData = new FormData();
  formData.append("photo", file); // ✅ Matches backend
  formData.append("description", description);
  formData.append("location", location);

  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "⏳ Submitting...";

  try {
    const response = await fetch(`${API_BASE}/api/posts`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    button.disabled = false;
    button.textContent = "📤 Report Missing";

    if (response.ok && result.success) {
      alert("✅ Post submitted successfully!");
      form.reset();
      preview.style.display = "none";
      window.location.href = "feed.html"; // ✅ Redirect works now
    } else {
      alert("❌ Failed to submit: " + (result.error || "Unknown error"));
    }
  } catch (err) {
    console.error("❌ Error submitting post:", err);
    alert("Server error: Could not upload post.");
    button.disabled = false;
    button.textContent = "📤 Report Missing";
  }
});