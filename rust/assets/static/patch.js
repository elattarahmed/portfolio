console.log("Patch script v6 loaded");

async function patchContent() {
	try {
		console.log("Fetching content...");
		const response = await fetch("/api/content");
		const data = await response.json();
		console.log("Content received for patching.");

		// --- Patch Last Modified Date ---
		const patchDate = () => {
			const greenDate = Array.from(document.querySelectorAll("p")).find(
				(el) =>
					el.innerText.includes("Dernière mise à jour") &&
					(el.className.includes("text-terminal-dim") ||
						el.className.includes("text-primary")),
			);

			if (greenDate && !greenDate.innerText.includes(data.hero["last-modified"])) {
				greenDate.innerText = "Dernière mise à jour : " + data.hero["last-modified"];

				// Remove duplicate from description if exists
				const pTags = document.querySelectorAll("p");
				for (let p of pTags) {
					if (
						p.innerText.includes("Dernière mise à jour :") &&
						!p.className.includes("text-terminal-dim") &&
						!p.className.includes("text-primary")
					) {
						p.innerHTML = p.innerHTML.replace(
							/Dernière mise à jour\s*:\s*(\d{2}\/\d{2}\/\d{4})?/g,
							"",
						);
					}
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

			if (!esgiHeader) return false;

			// 1. Find the button (header)
			const headerBtn = esgiHeader.closest("button");
			if (!headerBtn) return false;

			// 2. Find the content container (next sibling of the button)
			// React might remove/add this DOM node on toggle.
			let contentWrapper = headerBtn.nextElementSibling;
			if (!contentWrapper) return false; // Card is collapsed

			// 3. Find the inner container (padding wrapper)
			let container = contentWrapper.querySelector("div");
			if (!container) container = contentWrapper;

			// Check if we already injected details to prevent duplicate
			if (container.querySelector(".patched-details")) return true;

			// Create details HTML
			const detailsContainer = document.createElement("div");
			detailsContainer.className = "patched-details mt-4 text-sm text-muted-foreground font-mono";

			const esgiData = data.education.items.find((i) => i.school === "ESGI");
			if (esgiData && esgiData.sub_items) {
				esgiData.sub_items.forEach((year) => {
					const yearBlock = document.createElement("div");
					yearBlock.className = "mb-4 border-l-2 border-primary/20 pl-4";

					// --- Header (Clickable) ---
					const header = document.createElement("div");
					header.className =
						"cursor-pointer flex items-center justify-between group py-1 hover:bg-primary/5 rounded px-2 transition-colors";

					const titleContainer = document.createElement("div");
					titleContainer.className = "flex items-center gap-2";

					// Custom Arrow Style: → (text-primary)
					const arrow = document.createElement("span");
					arrow.innerHTML = "→";
					arrow.className =
						"text-primary mr-1 transition-transform duration-200 inline-block"; // inline-block needed for transform

					const title = document.createElement("strong");
					title.innerText = year.degree;
					title.className = "text-foreground font-mono"; // Ensure font-mono

					titleContainer.appendChild(arrow);
					titleContainer.appendChild(title);

					const period = document.createElement("span");
					period.innerText = year.period;
					period.className = "text-xs text-muted-foreground";

					header.appendChild(titleContainer);
					header.appendChild(period);

					// --- Content (Details) ---
					const content = document.createElement("div");
					content.className = "hidden mt-2 pl-6";

					if (year.details) {
						const ul = document.createElement("ul");
						ul.className = "space-y-1 text-muted-foreground";
						year.details.forEach((detail) => {
							const li = document.createElement("li");
							// Match existing detail style: small arrow + text
							li.innerHTML = `<span class="text-primary mr-2">→</span>${detail}`;
							ul.appendChild(li);
						});
						content.appendChild(ul);
					}

					// --- Event Listener ---
					header.addEventListener("click", (e) => {
						e.stopPropagation(); // Prevent bubbling to card toggle
						const isHidden = content.classList.contains("hidden");
						if (isHidden) {
							content.classList.remove("hidden");
							arrow.style.transform = "rotate(90deg)";
						} else {
							content.classList.add("hidden");
							arrow.style.transform = "rotate(0deg)";
						}
					});

					yearBlock.appendChild(header);
					yearBlock.appendChild(content);
					detailsContainer.appendChild(yearBlock);
				});
				container.appendChild(detailsContainer);
				console.log("ESGI details injected.");
				return true;
			}
			return false;
		};

		// Initial Patch
		patchDate();
		patchEducation();

		// --- Mutation Observer for Persistence ---
		// Watch for changes in the body (e.g., React unmounting/mounting content)
		const observer = new MutationObserver((mutations) => {
			let shouldPatch = false;
			for (const mutation of mutations) {
				if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
					shouldPatch = true;
					break;
				}
			}
			if (shouldPatch) {
				// Debounce could be added here if performance is an issue, but for this scale it's fine.
				patchDate();
				patchEducation();
			}
		});

		observer.observe(document.body, { childList: true, subtree: true });
		console.log("MutationObserver attached.");
	} catch (e) {
		console.error("Error in patch script:", e);
	}
}

// Run content patching
patchContent();
