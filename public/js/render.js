//render card
export function renderProjects(container, list, actions) {
  if (list.length === 0) {
    container.innerHTML = `<div class="col-12 text-center">No projects found!!</div>`;
    return;
  }

  container.innerHTML = list
    .map(
      (p, i) => `
      <div class="col-md-4">
        <div class="card h-100">
          <img src="${p.imageURL}" class="card-img-top" style="height:220px;object-fit:cover;">
          <div class="card-body">
            <h3>${p.projectName}</h3>
            <p>${p.startDate} → ${p.endDate}</p>
            <p>${p.description || "-"}</p>
            <p><strong>Tech:</strong> ${p.technologies.join(", ")}</p>

            <button onclick="showDetail(${i})">Detail</button>
            <button onclick="showEdit(${i})">Edit</button>
            <button onclick="deleteCard(${i})">Delete</button>
          </div>
        </div>
      </div>`,
    )
    .join("");
}
