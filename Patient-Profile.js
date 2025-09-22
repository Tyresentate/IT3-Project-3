// Toggle sections (Allergies & Medical Notes)
document.querySelectorAll(".toggle-header").forEach(header => {
  header.addEventListener("click", () => {
    const content = header.nextElementSibling;
    content.style.display = content.style.display === "block" ? "none" : "block";
    header.textContent = header.textContent.includes("⯆")
      ? header.textContent.replace("⯆", "⯅")
      : header.textContent.replace("⯅", "⯆");
  });
});

// Highlight selected drug row
const rows = document.querySelectorAll("#drug-table tbody tr");
rows.forEach(row => {
  row.addEventListener("click", () => {
    rows.forEach(r => r.classList.remove("active-row"));
    row.classList.add("active-row");
  });
});
