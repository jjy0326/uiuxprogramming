const noteForm = document.querySelector("#noteForm");
const titleInput = document.querySelector("#title");
const mainTitle = document.querySelector("#mainTitle");
const saveMessage = document.querySelector("#saveMessage");
const saveButton = document.querySelector("#saveButton");
const resetButton = document.querySelector("#resetButton");

const defaultTitle = "UX/UI 2주차 수업 내용과 정리";
const defaultPageTitle = "UX/UI 수업 간단 정리";

function loadTitle() {
    const savedTitle = localStorage.getItem("pageTitle");

    if (savedTitle) {
        mainTitle.textContent = savedTitle;
        document.title = savedTitle;
        titleInput.value = savedTitle;
    } else {
        mainTitle.textContent = defaultTitle;
        document.title = defaultPageTitle;
    }
}

function saveNote(event) {
    event.preventDefault();

    const title = titleInput.value.trim();

    if (title === "") {
        alert("노트 제목을 입력해 주세요.");
        titleInput.focus();
        return;
    }

    localStorage.setItem("pageTitle", title);

    mainTitle.textContent = title;
    document.title = title;

    alert("제목이 변경되었습니다.");

    saveMessage.textContent = "제목이 변경되었습니다.";
    saveMessage.classList.remove("is-error");
    saveMessage.classList.add("is-saved");

    saveButton.textContent = "변경 완료";
    saveButton.disabled = true;
    titleInput.disabled = true;
}

function resetNote() {
    localStorage.removeItem("pageTitle");

    mainTitle.textContent = defaultTitle;
    document.title = defaultPageTitle;

    noteForm.reset();

    titleInput.disabled = false;
    saveButton.disabled = false;
    saveButton.textContent = "저장하기";

    saveMessage.textContent = "노트 제목을 입력하고 저장해 주세요.";
    saveMessage.classList.remove("is-saved");
    saveMessage.classList.remove("is-error");

    alert("제목이 초기화되었습니다.");

    titleInput.focus();
}

noteForm.addEventListener("submit", saveNote);
resetButton.addEventListener("click", resetNote);

loadTitle();