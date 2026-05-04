(function () {
  const loginButton = document.querySelector("[data-yandex-login]");
  const statusNode = document.querySelector("[data-auth-status]");

  if (!loginButton || !statusNode) {
    return;
  }

  const setStatus = (message, isError) => {
    statusNode.textContent = message;
    statusNode.classList.toggle("text-danger", Boolean(isError));
    statusNode.classList.toggle("text-body-secondary", !isError);
  };

  loginButton.addEventListener("click", async () => {
    const endpoint = loginButton.dataset.authUrl || "/auth/yandex/url";

    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="mk-yandex-login-icon" aria-hidden="true">Я</span><span>Переход...</span>';
    setStatus("Готовим переход в Яндекс ID.", false);
    window.location.assign(endpoint);
  });
})();
