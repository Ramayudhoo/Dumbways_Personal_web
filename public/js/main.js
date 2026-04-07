import { getProjects, saveProjects } from "./storage.js";
import { renderProjects } from "./render.js";
import { getValue, getTech, toBase64 } from "./helpers.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#projectForm");
  const container = document.getElementById("projectCards");

  if (!form || !container) return;

  let projects = getProjects();

  renderProjects(container, projects);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = document.getElementById("formFile").files[0];

    const newProject = {
      projectName: getValue("Projectname").trim(),
      description: getValue("Description").trim(),
      startDate: getValue("startDate"),
      endDate: getValue("endDate"),
      technologies: getTech(),
      imageURL: file ? await toBase64(file) : "",
    };

    projects.push(newProject);
    saveProjects(projects);
    renderProjects(container, projects);

    form.reset();
  });

  window.deleteCard = (index) => {
    projects.splice(index, 1);
    saveProjects(projects);
    renderProjects(container, projects);
  };

  window.filterProjects = (keyword) => {
    const filtered = projects.filter((p) =>
      p.projectName.toLowerCase().includes(keyword.toLowerCase()),
    );
    renderProjects(container, filtered);
  };
});
