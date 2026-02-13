console.log("Patch script loaded");

async function patchContent() {
	try {
		console.log("Fetching content...");
		const response = await fetch("/api/content");
		const data = await response.json();
		console.log("Content received:", data);

		// --- Patch Last Modified Date ---
		const patchDate = () => {
			// 1. Remove the duplicate from description (non-green)
			const pTags = document.querySelectorAll("p");
			for (let p of pTags) {
				if (
					p.innerText.includes("Dernière mise à jour :") &&
					!p.className.includes("text-terminal-dim")
				) {
					// This is likely the description paragraph. Remove the text.
					console.log("Removing duplicate date text from:", p);
					p.innerHTML = p.innerHTML.replace(
						/Dernière mise à jour\s*:\s*(\d{2}\/\d{2}\/\d{4})?/g,
						"",
					);
				}
			}

			// 2. Update the green date
			const greenDate = Array.from(document.querySelectorAll("p")).find(
				(el) =>
					el.innerText.includes("Dernière mise à jour") &&
					(el.className.includes("text-terminal-dim") ||
						el.className.includes("text-primary")),
			);

			if (greenDate) {
				console.log("Found green date element:", greenDate);
				// Ensure it has the correct date
				if (!greenDate.innerText.includes(data.hero["last-modified"])) {
					// Keep the prefix, update the date
					greenDate.innerText = "Dernière mise à jour : " + data.hero["last-modified"];
					console.log("Green date updated.");
				}
				return true;
			}
			return false;
		};

		// --- Patch Education ---
		const patchEducation = () => {
			// Strategy: Find h3 containing "ESGI"
			const headings = Array.from(document.querySelectorAll("h3"));
			const esgiHeader = headings.find((el) => el.innerText && el.innerText.includes("ESGI"));

			if (esgiHeader) {
				console.log("Found ESGI header:", esgiHeader.innerText);
				// The structure is likely:
				// div (card)
				//   div (header container)
				//     h3 (ESGI)
				//     p (date)

				// We want to append to the outer div (card) or the header container
				// Let's try the parent of the header first, or grandparent
				let container = esgiHeader.parentElement.parentElement;
				// Verify if it looks like the card container
				if (!container || container.tagName === "BODY") {
					container = esgiHeader.parentElement;
				}

				// Check if we already injected details to prevent duplicate
				if (container.querySelector(".patched-details")) {
					console.log("Education details already patched.");
					return true;
				}

				// Create details HTML
				const detailsContainer = document.createElement("div");
				detailsContainer.className =
					"patched-details mt-4 text-sm text-muted-foreground font-mono"; // tailoring style

				const esgiData = data.education.items.find((i) => i.school === "ESGI");
				if (esgiData && esgiData.sub_items) {
					esgiData.sub_items.forEach((year) => {
						const yearBlock = document.createElement("div");
						yearBlock.className = "mb-4 border-l-2 border-primary/20 pl-4"; // Add some visual separation

						const title = document.createElement("strong");
						title.innerText = year.degree;
						title.className = "block text-foreground mb-1";
						yearBlock.appendChild(title);

						if (year.details) {
							const ul = document.createElement("ul");
							ul.className = "list-disc list-inside space-y-1";
							year.details.forEach((detail) => {
								const li = document.createElement("li");
								li.innerText = detail;
								ul.appendChild(li);
							});
							yearBlock.appendChild(ul);
						}
						detailsContainer.appendChild(yearBlock);
					});
					// Append to the container
					container.appendChild(detailsContainer);
					console.log("ESGI details injected into:", container);
					return true;
				}
			}
			return false;
		};

		// Polling to wait for DOM rendering
		let attempts = 0;
		const maxAttempts = 20; // 10 seconds (20 * 500ms)
		const interval = setInterval(() => {
			attempts++;
			const datePatched = patchDate();
			const eduPatched = patchEducation();

			if ((datePatched && eduPatched) || attempts >= maxAttempts) {
				clearInterval(interval);
				console.log(`Patching finished after ${attempts} attempts.`);
			}
		}, 500);
	} catch (e) {
		console.error("Error in patch script:", e);
	}
}

// Run content patching
patchContent();
