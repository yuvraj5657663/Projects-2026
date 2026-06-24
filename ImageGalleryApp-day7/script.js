const imageInput = document.getElementById("imageInput");
const uploadBtn = document.getElementById("uploadBtn");
const searchInput = document.getElementById("searchInput");
const gallery = document.getElementById("gallery");
const clearGalleryBtn = document.getElementById("clearGalleryBtn");
const previewSection = document.getElementById("previewSection");
const imagePreview = document.getElementById("imagePreview");


// State


let images = JSON.parse(localStorage.getItem("images")) || [];


// Save Images to Local Storage


function saveImages() {
    localStorage.setItem("images", JSON.stringify(images));
}


// Preview Selected Images


function renderPreview() {

    const files = Array.from(imageInput.files);

    imagePreview.innerHTML = "";

    if (files.length === 0) {
        previewSection.classList.remove("show");
        return;
    }

    previewSection.classList.add("show");

    files.forEach((file) => {

        const reader = new FileReader();

        reader.onload = function (event) {

            const previewCard = document.createElement("div");
            previewCard.className = "preview-card";

            previewCard.innerHTML = `
                <img src="${event.target.result}" alt="${file.name}">
                <p>${file.name}</p>
            `;

            imagePreview.appendChild(previewCard);
        };

        reader.readAsDataURL(file);
    });
}


// Render Gallery


function renderGallery(imageList = images) {

    gallery.innerHTML = "";

    if (imageList.length === 0) {
        gallery.innerHTML = "<h2>No Images Found 📂</h2>";
        saveImages();
        return;
    }

    imageList.forEach((image) => {

        const card = document.createElement("div");
        card.className = "image-card";

        card.innerHTML = `
            <img src="${image.src}" alt="${image.name}">

            <div class="image-info">

                <p class="image-name">
                    <strong>${image.name}</strong>
                </p>

                <p class="upload-date">
                    📅 ${image.uploadedAt}
                </p>

                <div class="button-group">

                    <a
                        href="${image.src}"
                        download="${image.name}"
                    >
                        <button>
                            ⬇ Download
                        </button>
                    </a>

                    <button
                        class="delete-btn"
                        onclick="deleteImage(${image.id})"
                    >
                        🗑 Delete
                    </button>

                </div>

            </div>
        `;

        gallery.appendChild(card);
    });

    saveImages();
}


// Upload Multiple Images


function uploadImages() {

    const files = imageInput.files;

    if (files.length === 0) {
        alert("Please select one or more images.");
        return;
    }

    for (const file of files) {

        const reader = new FileReader();

        reader.onload = function (event) {

            const imageObject = {

                id: Date.now() + Math.random(),

                name: file.name,

                src: event.target.result,

                uploadedAt: new Date().toLocaleString()

            };

            images.push(imageObject);

            renderGallery();
        };

        reader.readAsDataURL(file);
    }

    imageInput.value = "";
    imagePreview.innerHTML = "";
    previewSection.classList.remove("show");
}


// Delete Image


function deleteImage(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this image?"
    );

    if (!confirmed) {
        return;
    }

    images = images.filter((image) => {
        return image.id !== id;
    });

    renderGallery();
}


// Clear Entire Gallery


function clearGallery() {

    if (images.length === 0) {
        alert("Gallery is already empty.");
        return;
    }

    const confirmed = confirm(
        "Delete all images from the gallery?"
    );

    if (!confirmed) {
        return;
    }

    images = [];

    renderGallery();
}


// Search Images


searchInput.addEventListener("input", function () {

    const keyword = this.value.toLowerCase().trim();

    const filteredImages = images.filter((image) => {

        return image.name
            .toLowerCase()
            .includes(keyword);

    });

    renderGallery(filteredImages);

});


// Event Listeners


uploadBtn.addEventListener("click", uploadImages);
imageInput.addEventListener("change", renderPreview);

if (clearGalleryBtn) {
    clearGalleryBtn.addEventListener("click", clearGallery);
}


// Initial Render


renderGallery();
