// JavaScript source code

var old_residents = residentsAll;
var new_residents = [];

function load_old_residents() {

	var table;
	var row;
	var cell;
	var input;

	table = document.getElementById('resident-table');
	table.innerHTML = "";

	//create header
	row = document.createElement('tr');
	cell = document.createElement('th');
	cell.innerHTML = "Name";
	row.append(cell);
	cell = document.createElement('th');
	cell.innerHTML = "PGY";
	row.append(cell);

	for (let i = 0; i < old_residents.length; i++) {

		row = document.createElement('tr');

		//name
		cell = document.createElement('td');
		input = document.createElement('input');
		input.maxLength = 7;
		input.setAttribute('value', old_residents[i].name);
		input.setAttribute('id', 'resident-' + i + '-name');
		cell.append(input);
		row.append(cell);

		//PGY
		cell = document.createElement('td');
		input = document.createElement('input');
		input.setAttribute('value', old_residents[i].PGY);
		input.setAttribute('id', 'resident-' + i + '-PGY');
		cell.append(input);
		row.append(cell);

		table.append(row);
	}
}

function save_new_residents() {

	new_residents = [];

	var newName;
	var newPGY;

	//read new info, trims leading and trailing whitespace
	for (let i = 0; i < old_residents.length; i++) {
		newName = document.getElementById('resident-' + i + '-name').value.trim();
		newPGY = document.getElementById('resident-' + i + '-PGY').value.trim();

		new_residents.push({ name: newName, PGY: newPGY });
	}

	//ERROR CHECK
	//no same names
	if (hasDuplicateNames(new_residents)) return;
	//no empty names
	for (let resident of new_residents) {
		if (resident.name == "") {
			window.alert('Error: no blank resident name allowed');
			return;
		}
	}
	//PGY 1-5
	var validPGY = ['1', '2', '3', '4', '5'];
	for (let resident of new_residents) {
		if (!validPGY.includes(resident.PGY)) {
			window.alert('Error: PGY must be whole number 1-5\n' + resident.PGY + ' not allowed');
			return;
		}
	}

	//order by PGY high to low then alphabetically
	sortByPGYHighAlphabetical(new_residents);

	//save to file
	var textContent = "residentsAll = [\n\n";
	for (let resident of new_residents) {
		textContent += "    {name:'" + resident.name + "', PGY:" + resident.PGY + "}";
		if (resident != new_residents[new_residents.length - 1]) textContent += ",";
		textContent += "\n";
	}
	textContent += "];";

	// Create a Blob
	const blob = new Blob([textContent], { type: 'text/plain' });

	// Create a link element to download the Blob as a file
	var link = document.createElement('a');
	link.href = window.URL.createObjectURL(blob);
	link.download = 'residents.js'; // Specify the filename
	link.click();
}

function hasDuplicateNames(residents) {

	var names = [];
	for (let resident of residents) {
		if (names.includes(resident.name)) {
			window.alert('Error: duplicate name (' + resident.name + ')');
			return true;
		}
		else {
			names.push(resident.name);
		}
	}

	return false;
}


function byPGYHighAlphabetical(low, high) {

	var num = 0;

	//sort PGY high to low
	num = high.PGY - low.PGY;
	if (num != 0) return num;

	//if equal return alphabetically
	num = low.name.localeCompare(high.name);
	return num;
}
function sortByPGYHighAlphabetical(residents) {

	residents.sort(byPGYHighAlphabetical);
}