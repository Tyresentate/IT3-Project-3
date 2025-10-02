// Renamed from Patient-Profile.js
// ...existing code from Patient-Profile.js will be placed here...
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

const rows = document.querySelectorAll("#drug-table tbody tr");
rows.forEach(row => {
	row.addEventListener("click", () => {
		rows.forEach(r => r.classList.remove("active-row"));
		row.classList.add("active-row");
	});
});

// Logout button functionality
document.getElementById("logoutBtn")?.addEventListener("click", function(e) {
	e.preventDefault();
	window.location.href = "index.html";
});
