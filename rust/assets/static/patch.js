console.log("Patch script v7 loaded");

async function patchContent() {
	try {
		console.log("Fetching content...");
		const response = await fetch("/api/content");
		const data = await response.json();
		console.log("Content received for patching.");

		// --- Safe Text Node Manipulation Helper ---
		const safeRemoveText = (element, searchText) => {
			if (!element) return;
			// Iterate backwards to safely remove
			for (let i = element.childNodes.length - 1; i >= 0; i--) {
				const node = element.childNodes[i];
				if (node.nodeType === Node.TEXT_NODE && node.nodeValue.includes(searchText)) {
					console.log("Removing text from text node:", node.nodeValue);
					node.nodeValue = node.nodeValue.replace(searchText, "");
				} else if (node.nodeType === Node.ELEMENT_NODE) {
					safeRemoveText(node, searchText); // Recurse
				}
			}
		};

		// --- Patch Last Modified Date ---
		const patchDate = () => {
			const greenDate = Array.from(document.querySelectorAll("p")).find(
				(el) =>
					el.innerText.includes("Dernière mise à jour") &&
					(el.className.includes("text-terminal-dim") ||
						el.className.includes("text-primary")),
			);

			if (greenDate && !greenDate.innerText.includes(data.hero["last-modified"])) {
				// Safe update for green date
				// We can safely set innerText here because this specific node is usually a leaf or specific container
				// But let's be safer: find the text node.
				let updated = false;
				greenDate.childNodes.forEach((node) => {
					if (
						node.nodeType === Node.TEXT_NODE &&
						node.nodeValue.includes("Dernière mise à jour")
					) {
						node.nodeValue = "Dernière mise à jour : " + data.hero["last-modified"];
						updated = true;
					}
				});
				if (!updated) {
					// Fallback if structure is weird
					greenDate.innerText = "Dernière mise à jour : " + data.hero["last-modified"];
				}

				// Remove duplicate from description if exists
				const pTags = document.querySelectorAll("p");
				for (let p of pTags) {
					if (
						p.innerText.includes("Dernière mise à jour :") &&
						!p.className.includes("text-terminal-dim") &&
						!p.className.includes("text-primary")
					) {
						// Use safe removal instead of innerHTML
						// This regex matches the standard text to remove
						// "Dernière mise à jour : XX/XX/XXXX"
						// pass a static string or simple regex replacement logic manually
						// Since textContent/innerText touches DOM, we iterate nodes.

						// We'll just look for the prefix string start for simplicity in text nodes
						safeRemoveText(p, "Dernière mise à jour :");
						// Also try to remove the date part if it's separate?
						// The user error showed "NotFoundError" likely from the innerHTML replace.
						// Just clearing the text node value is much safer.
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
			let contentWrapper = headerBtn.nextElementSibling;
			if (!contentWrapper) return false; // Card is collapsed

			// 3. Find the inner container (padding wrapper)
			let container = contentWrapper.querySelector("div");
			if (!container) container = contentWrapper;

			// Check if we already injected details
			// We use a specific ID now to be sure
			if (container.querySelector("#esgi-patched-details")) return true;

			// Create details HTML
			const detailsContainer = document.createElement("div");
			detailsContainer.id = "esgi-patched-details"; // ID for easier lookup
			detailsContainer.className = "mt-4 text-sm text-muted-foreground font-mono";

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

					const arrow = document.createElement("span");
					arrow.textContent = "→"; // plain text content
					arrow.className =
						"text-primary mr-1 transition-transform duration-200 inline-block";

					const title = document.createElement("strong");
					title.textContent = year.degree;
					title.className = "text-foreground font-mono";

					titleContainer.appendChild(arrow);
					titleContainer.appendChild(title);

					const period = document.createElement("span");
					period.textContent = year.period;
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

							const arrowSpan = document.createElement("span");
							arrowSpan.className = "text-primary mr-2";
							arrowSpan.textContent = "→";

							const textNode = document.createTextNode(detail);

							li.appendChild(arrowSpan);
							li.appendChild(textNode);
							ul.appendChild(li);
						});
						content.appendChild(ul);
					}

					// --- Event Listener ---
					header.addEventListener("click", (e) => {
						e.stopPropagation(); // Critical to stop bubbling
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

				// Validate if container is still connected before appending
				if (container.isConnected) {
					container.appendChild(detailsContainer);
					console.log("ESGI details injected safely.");
				}
				return true;
			}
			return false;
		};

		// Initial Patch
		requestAnimationFrame(() => {
			patchDate();
			patchEducation();
		});

		// --- Mutation Observer ---
		const observer = new MutationObserver((mutations) => {
			let shouldPatch = false;
			// Check if relevant nodes were added
			// We verify if our injected content is missing when it should be there
			const esgiHeader = Array.from(document.querySelectorAll("h3")).find((el) =>
				el.innerText.includes("ESGI"),
			);
			if (esgiHeader) {
				const btn = esgiHeader.closest("button");
				if (btn && btn.nextElementSibling) {
					// Check if details are missing
					if (!document.getElementById("esgi-patched-details")) {
						shouldPatch = true;
					}
				}
			}

			if (shouldPatch) {
				// Use requestAnimationFrame to avoid conflict during render cycle
				requestAnimationFrame(() => {
					patchDate();
					patchEducation();
				});
			}
		});

		observer.observe(document.body, { childList: true, subtree: true });
		console.log("MutationObserver attached (Safe Mode).");
	} catch (e) {
		console.error("Error in patch script:", e);
	}
}

// Run content patching
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", patchContent);
} else {
	patchContent();
}
