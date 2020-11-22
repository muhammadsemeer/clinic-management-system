const menu = document.querySelector(".menu");

menu.addEventListener("click", () => {
  const sidebar = document.querySelector(".sidebar");
  const adminDash = document.querySelector(".admin-dash");
  menu.classList.toggle("active");
  sidebar.classList.toggle("active");
  adminDash.classList.toggle("active");
});
