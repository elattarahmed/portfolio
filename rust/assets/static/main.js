document.querySelectorAll(".expandable").forEach((el) => {
	el.addEventListener("click", () => el.classList.toggle("expanded"));
});

const burgerBtn = document.getElementById("burger-btn");
const navLinks  = document.getElementById("nav-links");

burgerBtn.addEventListener("click", () => {
	navLinks.classList.toggle("open");
	burgerBtn.classList.toggle("open");
});

navLinks.querySelectorAll(".nav-link").forEach((link) => {
	link.addEventListener("click", () => {
		navLinks.classList.remove("open");
		burgerBtn.classList.remove("open");
	});
});
