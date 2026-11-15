/* 하루노트 메인 페이지 기능 */
const $ = (selector) => document.querySelector(selector);
const readStorage = (key, fallback = "") => {
    try { return localStorage.getItem(key) ?? fallback; }
    catch (error) { console.error("저장 데이터를 읽지 못했습니다.", error); return fallback; }
};
const writeStorage = (key, value) => {
    try { localStorage.setItem(key, value); return true; }
    catch (error) { console.error("저장에 실패했습니다.", error); return false; }
};
function showMessage(element, message, type = "") {
    if (!element) return;
    element.textContent = message;
    element.classList.remove("is-saved", "is-error");
    if (type) element.classList.add(type);
}

/* 테마 */
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

/* 간단 메모 */
const memoInput = $("#nickname");
const memoMessage = $("#memoMessage");
if (memoInput) {
    memoInput.value = readStorage("studyMemo", "");
    memoInput.addEventListener("input", () => {
        const ok = writeStorage("studyMemo", memoInput.value.trim());
        showMessage(memoMessage, ok ? "메모가 저장되었습니다." : "메모 저장에 실패했습니다.", ok ? "is-saved" : "is-error");
    });
}

/* 학습 체크리스트 */
const studyChecks = [...document.querySelectorAll(".study-check")];
const studyProgress = $("#studyProgress");
const studyCompleteMessage = $("#studyCompleteMessage");
function updateStudyProgress() {
    const count = studyChecks.filter((item) => item.checked).length;
    if (studyProgress) studyProgress.textContent = `학습 진행률: ${count}/${studyChecks.length}`;
}
try {
    const checked = JSON.parse(readStorage("studyChecks", "[]"));
    if (Array.isArray(checked)) studyChecks.forEach((item) => item.checked = checked.includes(item.value));
} catch (error) { console.error("체크리스트를 불러오지 못했습니다.", error); }
studyChecks.forEach((item) => item.addEventListener("change", () => {
    writeStorage("studyChecks", JSON.stringify(studyChecks.filter((box) => box.checked).map((box) => box.value)));
    updateStudyProgress();
}));
const studyCompleteButton = $("#studyCompleteButton");
if (studyCompleteButton) studyCompleteButton.addEventListener("click", () => {
    const remaining = studyChecks.length - studyChecks.filter((item) => item.checked).length;
    showMessage(studyCompleteMessage, remaining === 0 ? "모든 학습 항목을 확인했습니다." : `${remaining}개 항목이 남아 있습니다.`, remaining === 0 ? "is-saved" : "");
});
updateStudyProgress();

/* 메뉴: PC와 모바일 열기/닫기, 현재 위치 표시 */
function setupNavigation() {
    const nav = $("#mainNav");
    const menu = $("#mainMenu");
    const toggle = $("#menuToggle");
    if (!nav || !menu || !toggle) return;
    const links = [...menu.querySelectorAll('a[href^="#"]')];
    const sections = links.map((link) => $(link.getAttribute("href"))).filter(Boolean);
    const setOpen = (open) => {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.textContent = open ? "메뉴 닫기" : "메뉴 열기";
    };
    const setCurrent = (id) => links.forEach((link) => {
        const active = link.hash === `#${id}`;
        link.classList.toggle("is-current", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
    });
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    links.forEach((link) => link.addEventListener("click", () => {
        setCurrent(link.hash.slice(1));
        setOpen(false);
    }));
    const syncHash = () => {
        const id = location.hash.slice(1);
        if (sections.some((section) => section.id === id)) setCurrent(id);
        else if (sections[0]) setCurrent(sections[0].id);
        setOpen(false);
    };
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    syncHash();
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            const visible = entries.filter((entry) => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
            if (visible) {
                const currentId = visible.target.id;
                setCurrent(currentId);
                // 스크롤 위치와 주소의 해시를 함께 맞추되 방문 기록은 추가하지 않습니다.
                if (location.hash !== `#${currentId}`) {
                    history.replaceState(null, "", `#${currentId}`);
                }
            }
        }, { rootMargin: "-20% 0px -65% 0px", threshold: [0, .2, .5] });
        sections.forEach((section) => observer.observe(section));
    }
    
}
setupNavigation();

/* 저장된 새 노트 목록과 필터 */
const noteList = $("#dynamicNoteList");
const noteMessage = $("#dynamicNoteMessage");
const resultCount = $("#noteResultCount");
const filterButtons = [...document.querySelectorAll(".filter-button")];
let activeFilter = "all";
function getDailyNotes() {
    try {
        const data = JSON.parse(readStorage("dailyNotes", "[]"));
        return Array.isArray(data) ? data.filter((note) => note && typeof note === "object") : [];
    } catch (error) { console.error("저장된 노트를 불러오지 못했습니다.", error); return null; }
}
function renderDynamicNotes() {
    if (!noteList) return;
    noteList.replaceChildren();
    const notes = getDailyNotes();
    if (notes === null) { showMessage(noteMessage, "저장된 노트를 불러오지 못했습니다.", "is-error"); if (resultCount) resultCount.textContent = "목록을 불러오지 못했습니다."; return; }
    const filtered = notes.filter((note) => {
        const hasSubject = Boolean(String(note.subject || "").trim());
        return activeFilter === "all" || (activeFilter === "subject" && hasSubject) || (activeFilter === "no-subject" && !hasSubject);
    });
    if (resultCount) resultCount.textContent = `전체 ${notes.length}개 중 ${filtered.length}개 표시`;
    if (notes.length === 0) { showMessage(noteMessage, "아직 작성한 노트가 없습니다. 새 노트를 작성해 보세요."); return; }
    if (filtered.length === 0) { showMessage(noteMessage, "선택한 조건에 해당하는 노트가 없습니다. 다른 필터를 선택해 주세요."); return; }
    showMessage(noteMessage, "");
    filtered.forEach((note) => {
        const article = document.createElement("article"); article.className = "note-item";
        const heading = document.createElement("h4"); heading.textContent = note.title || "제목 없는 노트";
        const subject = document.createElement("p"); subject.textContent = note.subject ? `수업 주제: ${note.subject}` : "수업 주제 없음";
        const date = document.createElement("small"); date.textContent = note.date ? `작성일: ${note.date}` : "";
        article.append(heading, subject, date);
        const sections = Array.isArray(note.sections) ? note.sections : [];
        if (sections.length) {
            const list = document.createElement("ol"); list.className = "saved-note-sections";
            sections.forEach((section, index) => {
                const li = document.createElement("li");
                const title = document.createElement("strong"); title.textContent = `${index + 1}. ${section.title || "항목"}`;
                const content = document.createElement("p"); content.textContent = section.content || "";
                li.append(title, content); list.appendChild(li);
            });
            article.appendChild(list);
        }
        noteList.appendChild(article);
    });
}
filterButtons.forEach((button) => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", String(selected));
    });
    renderDynamicNotes();
}));
window.addEventListener("pageshow", renderDynamicNotes);
window.addEventListener("storage", (event) => { if (event.key === "dailyNotes") renderDynamicNotes(); });
renderDynamicNotes();
