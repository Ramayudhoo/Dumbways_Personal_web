//code helper function to get and set value of input, checkbox, and convert file to base64
export function getValue(id) {
  return document.getElementById(id).value;
}

export function setValue(id, value) {
  document.getElementById(id).value = value;
}

export function setCheckbox(id, list, value) {
  document.getElementById(id).checked = list.includes(value);
}

export function getTech(prefix = "") {
  const tech = [];

  if (document.getElementById(`${prefix}tech1`)?.checked) tech.push("Node.js");
  if (document.getElementById(`${prefix}tech2`)?.checked) tech.push("React.js");
  if (document.getElementById(`${prefix}tech3`)?.checked) tech.push("Next.js");
  if (document.getElementById(`${prefix}tech4`)?.checked)
    tech.push("TypeScript");

  return tech;
}

export function toBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}
