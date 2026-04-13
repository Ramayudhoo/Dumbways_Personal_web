document.addEventListener("DOMContentLoaded", () => {
  // ======= REGISTER FORM =======
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (!name || !email || !password || !confirmPassword) {
        e.preventDefault();
        showError("Semua field wajib diisi");
        return;
      }

      if (password.length < 6) {
        e.preventDefault();
        showError("Password minimal 6 karakter");
        return;
      }

      if (password !== confirmPassword) {
        e.preventDefault();
        showError("Password dan konfirmasi password tidak cocok");
        return;
      }
    });
  }

  // ======= LOGIN FORM =======
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!email || !password) {
        e.preventDefault();
        showError("Email dan password wajib diisi");
        return;
      }
    });
  }

  // ======= HELPER =======
  function showError(msg) {
    // cari error container yang sudah ada, atau buat baru
    let errDiv = document.getElementById("clientError");
    if (!errDiv) {
      errDiv = document.createElement("div");
      errDiv.id = "clientError";
      errDiv.className = "alert alert-danger mt-2";
      const form = registerForm || loginForm;
      form.prepend(errDiv);
    }
    errDiv.textContent = msg;
    errDiv.style.display = "block";
  }
});
