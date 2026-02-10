document.addEventListener("DOMContentLoaded", () => {
	fetch("content.json")
		.then((response) => response.json())
		.then((data) => {
			// Header
			document.querySelector(".logo").textContent = data.header.logo;
			// Header - Dynamic Navigation
			const navList = document.querySelector("nav ul");
			navList.innerHTML = ""; // Clear existing links
			data.header.nav.forEach((item) => {
				const li = document.createElement("li");
				const a = document.createElement("a");
				a.href = item.link;
				a.textContent = item.text;
				li.appendChild(a);
				navList.appendChild(li);
			});

			// Hero
			const heroH1 = document.querySelector(".hero h1");
			heroH1.innerHTML = `${data.hero.greeting} <span class="highlight">${data.hero.name}</span>`;
			document.querySelector(".hero .hero-title").textContent = data.hero.title;
			document.querySelector(".hero .hero-description").textContent =
				data.hero.description + " " + data.hero["last-modified"]; // Added space for safety
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
                    <div class="card-header">
                        <h3>${project.title}</h3>
                        <span class="difficulty ${project.difficulty.toLowerCase()}">${project.difficulty}</span>
                    </div>
                    <p class="summary">${project.description}</p>
                    <div class="details">
                         <ul>
                            ${project.details.map((detail) => `<li>${detail}</li>`).join("")}
                        </ul>
                    </div>
                `;
				projectCard.addEventListener("click", () => {
					projectCard.classList.toggle("expanded");
				});
				projectsContainer.appendChild(projectCard);
			});

			// Experience
			document.querySelector("#experience h2").textContent = data.experience.title;
			const experienceContainer = document.querySelector(".experience-list");
			experienceContainer.innerHTML = "";
			data.experience.items.forEach((item) => {
				const div = document.createElement("div");
				div.className = "experience-item";
				div.innerHTML = `
                    <div class="header-content">
                        <h3>${item.role}</h3>
                        <div class="company">${item.company}</div>
                        <div class="period">${item.period}</div>
                    </div>
                    <p class="summary">${item.description}</p>
                    <div class="details">
                        <ul>
                            ${item.details.map((detail) => `<li>${detail}</li>`).join("")}
                        </ul>
                    </div>
                `;
				div.addEventListener("click", () => {
					div.classList.toggle("expanded");
				});
				experienceContainer.appendChild(div);
			});

			// Education
			document.querySelector("#education h2").textContent = data.education.title;
			const educationContainer = document.querySelector(".education-list");
			educationContainer.innerHTML = "";
			data.education.items.forEach((item) => {
				const div = document.createElement("div");
				div.className = "education-item";

				let detailsHTML = "";
				if (item.sub_items) {
					detailsHTML += `<div class="sub-items-container">`;
					item.sub_items.forEach((sub) => {
						detailsHTML += `
                            <div class="sub-item">
                                <div class="sub-header">
                                    <h4>${sub.degree}</h4>
                                    <span class="sub-period">${sub.period}</span>
                                </div>
                                <ul>
                                    ${sub.details.map((d) => `<li>${d}</li>`).join("")}
                                </ul>
                            </div>
                        `;
					});
					detailsHTML += `</div>`;
				}

				// Add regular details if any (before sub-items)
				if (item.details && item.details.length > 0) {
					detailsHTML =
						`<ul>${item.details.map((detail) => `<li>${detail}</li>`).join("")}</ul>` +
						detailsHTML;
				}

				div.innerHTML = `
                    <div class="header-content">
                        <h3>${item.degree}</h3>
                        <div class="school">${item.school}</div>
                        <div class="period">${item.period}</div>
                    </div>
                    <div class="details">
                        ${detailsHTML}
                    </div>
                `;
				div.addEventListener("click", (e) => {
					// Prevent closing when clicking inside a sub-item (optional, but good UX)
					div.classList.toggle("expanded");
				});
				educationContainer.appendChild(div);
			});

			// Skills
			document.querySelector("#skills h2").textContent = data.skills.title;
			const skillsContainer = document.querySelector(".skills-list");
			skillsContainer.innerHTML = "";
			data.skills.items.forEach((skill) => {
				const li = document.createElement("li");
				li.textContent = skill;
				skillsContainer.appendChild(li);
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
