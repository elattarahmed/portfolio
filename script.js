document.addEventListener("DOMContentLoaded", () => {
	fetch("content.json")
		.then((response) => response.json())
		.then((data) => {
			// Header
			document.querySelector(".logo").textContent = data.header.logo;
			const navLinks = document.querySelectorAll("nav ul li a");
			data.header.nav.forEach((item, index) => {
				if (navLinks[index]) {
					navLinks[index].textContent = item.text;
					navLinks[index].href = item.link;
				}
			});

			// Hero
			const heroH1 = document.querySelector(".hero h1");
			heroH1.innerHTML = `${data.hero.greeting} <span class="highlight">${data.hero.name}</span>`;
			document.querySelector(".hero .hero-title").textContent = data.hero.title;
			document.querySelector(".hero .hero-description").textContent =
				data.hero.description + data.hero["last-modified"];
			const heroBtn = document.querySelector(".hero .btn");
			heroBtn.textContent = data.hero.buttonText;
			heroBtn.href = data.hero.buttonLink;

			// About
			document.querySelector("#about h2").textContent = data.about.title;
			document.querySelector("#about p").textContent = data.about.description;

			// Projects
			document.querySelector("#projects h2").textContent = data.projects.title;
			const projectsContainer = document.querySelector(".projects-grid");
			projectsContainer.innerHTML = ""; // Clear existing content
			data.projects.items.forEach((project) => {
				const projectCard = document.createElement("div");
				projectCard.className = "project-card";
				projectCard.innerHTML = `
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                `;
				projectsContainer.appendChild(projectCard);
			});

			// Contact
			document.querySelector("#contact h2").textContent = data.contact.title;
			document.querySelector("#contact p").textContent = data.contact.description;
			const contactBtn = document.querySelector("#contact .btn");
			contactBtn.textContent = data.contact.buttonText;
			contactBtn.href = data.contact.buttonLink;

			// Footer
			document.querySelector("footer p").innerHTML = data.footer.text;
		})
		.catch((error) => console.error("Error loading content:", error));
});
