(function () {
  const statusNode = document.querySelector("[data-yandex-callback-status]");
  const retryLink = document.querySelector("[data-yandex-callback-retry]");
  const progressNode = document.querySelector(".mk-auth-progress");

  if (!statusNode) {
    return;
  }

  const setStatus = (message, isError) => {
    statusNode.textContent = message;
    statusNode.classList.toggle("text-danger", Boolean(isError));
    statusNode.classList.toggle("text-body-secondary", !isError);
    retryLink?.classList.toggle("d-none", !isError);
    progressNode?.classList.toggle("d-none", Boolean(isError));
  };

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  const errorDescription = params.get("error_description");

  if (error) {
    setStatus(errorDescription || "Яндекс ID не подтвердил вход.", true);
    return;
  }

  if (!code) {
    setStatus("В URL нет кода авторизации. Начните вход заново.", true);
    return;
  }

  const finishLogin = async () => {
    setStatus("Передаем код авторизации на сервер.", false);

    const response = await fetch("/auth/yandex/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error("Сервер не смог завершить вход через Яндекс ID.");
    }

    return response.json();
  };

  finishLogin()
    .then(() => {
      setStatus("Вход через Яндекс ID выполнен. Перенаправляем в систему.", false);
      window.setTimeout(() => {
        window.location.assign("index.html");
      }, 1200);
    })
    .catch((error) => {
      setStatus(error.message || "Не удалось завершить вход через Яндекс ID.", true);
    });
})();
