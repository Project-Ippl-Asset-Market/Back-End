import { db } from '../config/firebaseConfig.js';

const assetDatasetsCollection = db.collection('assetDatasets');
const assetImage2DCollection = db.collection('assetImage2D');
const assetImage3DCollection = db.collection('assetImage3D');

export const fetchAndDisplayAssets = async () => {
	setLoading(true);
	try {
		// Ambil docId dari query string URL
		const urlParams = new URLSearchParams(window.location.search);
		const docId = urlParams.get('docId'); // Misalkan docId ada di query string sebagai ?docId=Fln4fuwOcpdQl6kH1bUq

		if (!docId) {
			throw new Error("docId tidak ditemukan dalam URL.");
		}

		// Fetch datasets
		const datasets = await fetchAssetDatasets(docId);
		const images2D = await fetchAssetImage2D(docId);
		const images3D = await fetchAssetImage3D(docId);

		// Open a new tab for displaying the assets
		const newTab = window.open("", "_blank");
		if (!newTab) {
			throw new Error("Unable to open new tab. Check your browser's popup blocker.");
		}
		newTab.document.write("<h1>Asset Datasets and Images</h1>");

		// Display datasets
		newTab.document.write("<h2>Datasets</h2>");
		newTab.document.write("<ul>");
		datasets.forEach(dataset => {
			newTab.document.write(`<li>${dataset.id}: ${JSON.stringify(dataset)}</li>`);
		});
		newTab.document.write("</ul>");

		// Display 2D images
		newTab.document.write("<h2>2D Images</h2>");
		const imageContainer2D = newTab.document.createElement("div");
		imageContainer2D.style.display = "flex";
		imageContainer2D.style.flexWrap = "wrap";
		imageContainer2D.style.gap = "10px";
		newTab.document.body.appendChild(imageContainer2D);

		images2D.forEach(image => {
			const imgDiv = newTab.document.createElement("div");
			imgDiv.style.textAlign = "center";
			imgDiv.innerHTML = `
                <h3>${image.name}</h3>
                <img src="${image.url}" alt="${image.name}" style="max-width: 150px; max-height: 150px; object-fit: cover; margin: 10px;" />
            `;
			imageContainer2D.appendChild(imgDiv);
		});

		// Display 3D images
		newTab.document.write("<h2>3D Images</h2>");
		const imageContainer3D = newTab.document.createElement("div");
		imageContainer3D.style.display = "flex";
		imageContainer3D.style.flexWrap = "wrap";
		imageContainer3D.style.gap = "10px";
		newTab.document.body.appendChild(imageContainer3D);

		images3D.forEach(image => {
			const imgDiv = newTab.document.createElement("div");
			imgDiv.style.textAlign = "center";
			imgDiv.innerHTML = `
                <h3>${image.name}</h3>
                <img src="${image.url}" alt="${image.name}" style="max-width: 150px; max-height: 150px; object-fit: cover; margin: 10px;" />
            `;
			imageContainer3D.appendChild(imgDiv);
		});

	} catch (error) {
		console.error("Error fetching or displaying assets:", error);
	} finally {
		setLoading(false);
	}
};

export const fetchAssetDatasets = async (docId) => {
	const snapshot = await assetDatasetsCollection.where('docId', '==', docId).get();
	return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const fetchAssetImage2D = async (docId) => {
	const snapshot = await assetImage2DCollection.where('docId', '==', docId).get();
	return snapshot.docs.map(doc => {
		const data = doc.data();
		return {
			id: doc.id,
			name: data.asset2DName,
			url: data.asset2DFile ? data.asset2DFile : null
		};
	});
};

export const fetchAssetImage3D = async (docId) => {
	const snapshot = await assetImage3DCollection.where('docId', '==', docId).get();
	return snapshot.docs.map(doc => {
		const data = doc.data();
		return {
			id: doc.id,
			name: data.asset3DName,
			url: data.asset3DFile ? data.asset3DFile : null
		};
	});
};

export const fetchAssetById = async (id) => {
	console.log(`Fetching asset with ID: ${id}`);

	let doc = await assetImage2DCollection.doc(id).get();
	if (doc.exists) {
		return { id: doc.id, ...doc.data() };
	}

	doc = await assetImage3DCollection.doc(id).get();
	if (doc.exists) {
		return { id: doc.id, ...doc.data() };
	}

	return null;
};
