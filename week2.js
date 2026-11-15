/* 2주차 페이지 기능 */
const $ = (selector) => document.querySelector(selector);
function readStorage(key, fallback = "") { try { return localStorage.getItem(key) ?? fallback; } catch (error) { console.error(error); return fallback; } }
function writeStorage(key, value) { try { localStorage.setItem(key, value); return true; } catch (error) { console.error(error); return false; } }
const themeButton = $("#themeButton");
function loadTheme() {
    const dark = readStorage("pageTheme", "light") === "dark";
    document.body.classList.toggle("dark", dark);
    if (themeButton) themeButton.textContent = dark ? "라이트 테마" : "다크 테마";
}
if (themeButton) themeButton.addEventListener("click", () => {
    const dark = document.body.classList.toggle("dark");
    themeButton.textContent = dark ? "라이트 테마" : "다크 테마";
    writeStorage("pageTheme", dark ? "dark" : "light");
});

/* 현재 메뉴 및 PC·모바일 메뉴 열기/닫기 */
function setupNavigation() {
    const nav = $("#mainNav"), menu = $("#mainMenu"), toggle = $("#menuToggle");
    if (!nav || !menu || !toggle) return;
    const links = [...menu.querySelectorAll('a[href^="#"]')];
    const sections = links.map((link) => $(link.hash)).filter(Boolean);
    const setOpen = (open) => { nav.classList.toggle("is-open", open); toggle.setAttribute("aria-expanded", String(open)); toggle.textContent = open ? "메뉴 닫기" : "메뉴 열기"; };
    const setCurrent = (id) => links.forEach((link) => {
        const active = link.hash === `#${id}`;
        link.classList.toggle("is-current", active);
        if (active) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current");
    });
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    links.forEach((link) => link.addEventListener("click", () => { setCurrent(link.hash.slice(1)); setOpen(false); }));
    const syncHash = () => { const id = location.hash.slice(1); if (sections.some((section) => section.id === id)) setCurrent(id); else if (sections[0]) setCurrent(sections[0].id); setOpen(false); };
    window.addEventListener("hashchange", syncHash); window.addEventListener("popstate", syncHash); syncHash();
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => { const entry = entries.filter((item) => item.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0]; if (entry) setCurrent(entry.target.id); }, {rootMargin:"-20% 0px -65% 0px",threshold:[0,.2,.5]});
        sections.forEach((section) => observer.observe(section));
    }
    
}
setupNavigation();

/* 2주차 탭 */
const tabs = [...document.querySelectorAll(".tab")];
const panels = [...document.querySelectorAll(".panel")];
function activateTab(selected) {
    tabs.forEach((tab) => { const active = tab === selected; tab.classList.toggle("is-active", active); tab.setAttribute("aria-selected", String(active)); tab.tabIndex = active ? 0 : -1; });
    panels.forEach((panel) => panel.hidden = panel.id !== selected.dataset.target);
}
function handleTabKeydown(event) {
    const index = tabs.indexOf(event.currentTarget); let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0; else if (event.key === "End") next = tabs.length - 1; else return;
    event.preventDefault(); activateTab(tabs[next]); tabs[next].focus();
}
tabs.forEach((tab) => { tab.addEventListener("click", () => activateTab(tab)); tab.addEventListener("keydown", handleTabKeydown); });

/* 2주차 노트 저장 */
const form = $("#noteForm"), titleInput = $("#title"), contentInput = $("#noteContent"), saveButton = $("#saveButton"), resetButton = $("#resetButton"), message = $("#saveMessage");
let notes = [];
function showMessage(text, type = "") { if (!message) return; message.textContent = text; message.classList.remove("is-saved", "is-error"); if (type) message.classList.add(type); }
function loadNotes() { try { const data = JSON.parse(readStorage("savedNotes", "[]")); notes = Array.isArray(data) ? data.filter((note) => note && typeof note.title === "string" && typeof note.content === "string") : []; } catch (error) { notes = []; console.error(error); } }
function clearForm() { if (!form) return; form.reset(); showMessage("작성 내용을 초기화했습니다."); }
if (form) form.addEventListener("submit", (event) => {
    event.preventDefault(); const title = titleInput.value.trim(), content = contentInput.value.trim();
    if (!title || title.length > 15) { showMessage("제목은 1자 이상 15자 이하로 입력해 주세요.", "is-error"); titleInput.focus(); return; }
    if (!content || content.length > 2000) { showMessage("내용은 1자 이상 2,000자 이하로 입력해 주세요.", "is-error"); contentInput.focus(); return; }
    const now = new Date().toLocaleString("ko-KR");
    notes.push({id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`), title, content, createdAt: now, updatedAt: now});
    if (!writeStorage("savedNotes", JSON.stringify(notes))) { notes.pop(); showMessage("저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.", "is-error"); return; }
    clearForm(); showMessage("노트를 저장했습니다. 메인 페이지에서 확인할 수 있습니다.", "is-saved");
});
if (resetButton) resetButton.addEventListener("click", clearForm);
loadNotes(); loadTheme();
