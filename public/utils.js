async function getCurrentUser() {
  const response = await fetch("/users/me", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  const data = await response.json();
  console.log(data);
  return data;
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value == null ? "" : String(value);
  return element.innerHTML;
}

function getSafeImageUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const imageUrl = new URL(value, window.location.origin);
    if (imageUrl.protocol !== "http:" && imageUrl.protocol !== "https:") {
      return "";
    }
    return imageUrl.href;
  } catch (err) {
    return "";
  }
}
