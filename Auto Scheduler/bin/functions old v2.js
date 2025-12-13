//-----------------------------

/* global data */ {
    var month = [];
    var residents = [];
    var blueTeam = [];
    var redTeam = [];
    var eduTeam = [];
    var positions = ['blueChief', 'blueStaff', 'redChief', 'redStaff', 'consult', 'nightSr', 'nightJr'];
    var daysOfTheWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    //var residentProperties = ['name', 'PGY', 'shifts', 'consults', 'weekends', 'nights', 'teamColor', 'weekly'];
    //var shiftTypes = ['shifts', 'consults', 'weekends', 'nights'];
    var startDate = new Date();
    var stats = {};
}

//-----------------------------

function load() {

    //output list of residents with full availability
    var loadComplete = importResidents();
    if (!loadComplete) {
        document.body.innerHTML = '';
        return;
    }

    //To Do: set Edu Chief Radio
    // - set an edu chief by default when assigning teams
    // - change team assignment and resident.isEduChief upon manual dropdown change
    //setEduChiefRadio();

    //create assign teams function based on checkbox availability
    //change dropdown boxes everytime teams are assigned
    //clear team assignments when availability is changed

    //To Do: change team assignment & resident.teamColor upon manual dropdown change
    //To Do: clear schedule upon manual dropdown change
    assignTeams();

    //To Do: dislay total available residents, blue team, red team (update as appropriate)

    

    

    //setStartDate();

    //countTotalSelected();

    //setEduChiefRadio();

    //setDefaultEduChief();

    //assignTeams();
}
function importResidents() {

    //verify no duplicate names
    var names = [];
    for (let resident of residentsAll) {
        if (names.includes(resident.name)) {
            window.alert('Error: duplicate name (' + resident.name + ')');
            return false;
        }
        else {
            names.push(resident.name);
        }
    }

    //import residents from file to html for selection
    for (let resident of residentsAll) {
        listResident(resident.name, resident.PGY);
    }

    //set up residents array based on default availability
    getResidents();

    return true;
}
function listResident(argName, argPGY) {

    var form = document.getElementById('all-residents');
    var label = document.createElement('label');
    var span = document.createElement('span');

    //name & PGY
    span.textContent = argPGY + ' - ' + argName;
    span.setAttribute('class', 'resident-availability-name'); //set standard width
    label.appendChild(span);

    //availbility checkboxes (4)
    var checkboxes = [];
    for (let i = 0; i < 4; i++) {
        checkboxes[i] = document.createElement('input');
        checkboxes[i].type = 'checkbox';
        checkboxes[i].checked = true;
        checkboxes[i].name = 'resident-availability-checkbox'; //the handle to get all checkboxes later
        checkboxes[i].setAttribute('id', 'checkbox-' + argName + '-' + i);
        checkboxes[i].setAttribute('fName', argName);
        checkboxes[i].setAttribute('PGY', argPGY);
        checkboxes[i].setAttribute('week', i);

        //add event listener to clear available residents, team assignments, schedule, stats
        checkboxes[i].addEventListener('change', resetResidents);
        checkboxes[i].addEventListener('change', function () { vacationMode(argName) });

        label.append(checkboxes[i]);
    }

    //team dropdown
    var dropdown = document.createElement('select');
    dropdown.setAttribute('id', 'dropdown-' + argName); //handle to change visible dropdown option once teams are assigned
    var values = ['---', 'blue', 'red', 'edu'];
    var options = [];
    for (let i = 0; i < values.length; i++) {
        options[i] = document.createElement('option');
        options[i].innerHTML = values[i];

        if (values[i] == 'blue') {
            options[i].setAttribute('class', 'blue-text');
        }
        else if (values[i] == 'red') {
            options[i].setAttribute('class', 'red-text');
        }
        else {
            options[i].setAttribute('class', 'black-text');
        }

        dropdown.append(options[i]);
    }
    dropdown.onchange = function () {

        var argResident;

        //find resident
        for (let resident of residents) {
            if (resident.name == argName) {
                argResident = resident;
            }
        }

        //update team
        if (dropdown.value == 'blue') pushBlue(argResident);
        else if (dropdown.value == 'red') pushRed(argResident);
        else if (dropdown.value == 'edu') pushEdu(argResident);
        else unassignTeam();

        //update color
        if (dropdown.value == 'blue') dropdown.setAttribute('class', 'blue-text');
        else if (dropdown.value == 'red') dropdown.setAttribute('class', 'red-text');
        else dropdown.setAttribute('class', 'black-text');
    };

    label.append(dropdown);

    form.appendChild(label);
    form.appendChild(document.createElement('br'));
}

function assignTeams() {

    //clear residents, team assignments, schedule/month, stats
    resetResidents();
    
    //set up resident array including availability
    getResidents();
    sortByPGYHigh(residents);
    var partTimeResidents = [];
    
    //gather all PGY5
    var chiefs = [];
    for (let resident of residents) {
        if (resident.PGY == 5) chiefs.push(resident);
        else break;
    }

    //choose edu chief based on least availability
    sortByAvailabilityHigh(chiefs);
    if (chiefs.length == 3) {
        pushEdu(chiefs[2]);
    }

    //assign all full time residents
    for (let resident of residents) {

        //assign one chief to each team, exclude eduChief
        if (resident.PGY == 5) {
            if (resident.team != 'edu') {
                if (blueTeam.length <= redTeam.length) pushBlue(resident);
                else pushRed(resident);
            }
        }

        //assign all full time residents
        else if (resident.availability[4] == 4) {

            //even out team size
            if (blueTeam.length < redTeam.length) pushBlue(resident);
            else if (blueTeam.length > redTeam.length) pushRed(resident);

            //otherwise each team should have one resident from each PGY
            else {
                if (resident.PGY != blueTeam[blueTeam.length - 1].PGY) pushBlue(resident);
                else if (resident.PGY != redTeam[redTeam.length - 1].PGY) pushRed(resident);
                else pushBlue(resident);
            }
        }

        //gather all part time residents in separate array
        else {
            partTimeResidents.push(resident);
        }
    }

    //assign part time residents to a team - simply try to equalize available weeks
    bluePoints = 0;
    redPoints = 0;
    sortByAvailabilityHigh(partTimeResidents)
    for (let resident of partTimeResidents) {
        if (bluePoints <= redPoints) {
            pushBlue(resident);
            bluePoints += resident.availability[4];
        }
        else {
            pushRed(resident);
            redPoints += resident.availability[4];
        }
    }

    //NO NO NO change dropdown boxes everytime teams are assigned
    //Update boxes linked with assigning individual residents
    //updateDropdowns();
}
function getResidents() {

    residents = [];
    var index = -1;
    var week = 0;
    var checkboxes = document.querySelectorAll('input[name="resident-availability-checkbox"]:checked');

    for (let i = 0; i < checkboxes.length; i++) {

        //find resident if already in the list
        index = -1;
        for (let j = 0; j < residents.length; j++) {
            if (residents[j]['name'] == checkboxes[i].getAttribute('fname')) {
                index = j;
            }
        }

        //otherwise create new resident
        if (index == -1) {

            residents.push({});
            index = residents.length - 1;

            residents[index]['name'] = checkboxes[i].getAttribute('fname');
            residents[index]['PGY'] = checkboxes[i].getAttribute('PGY');
            residents[index]['shifts'] = [];
            residents[index]['consults'] = [];
            residents[index]['weekends'] = [];
            residents[index]['nights'] = [];
            residents[index]['team'] = '---';
            residents[index]['availability'] = [false, false, false, false, 0];
        }

        //add available for this specific week
        week = checkboxes[i].getAttribute('week');
        residents[index]['availability'][week] = true;
        residents[index]['availability'][4] += 1;
    }
}
function unassignTeam(argResident) {

    //unassign from all teams
    var teams = [blueTeam, redTeam, eduTeam];
    for (let team of teams) {
        if (team.includes(argResident)) {
            team.splice(team.indexOf(argResident), 1);
        }
    }

    argResident.team = '---';
}
function pushBlue(argResident) {

    //unassign from all teams
    unassignTeam(argResident);

    //add to blue team and change teamColor
    blueTeam.push(argResident);
    argResident.team = 'blue';

    //change dropdown
    var dropdown = document.getElementById('dropdown-' + argResident.name);
    for (let option of dropdown.options) {
        if (option.value == argResident.team) option.selected = true;
        else option.selected = false;
    }
    dropdown.dispatchEvent(new Event("change"));  //trigger 'onchange' function to change the dropdown color
}
function pushRed(argResident) {

    //unassign from all teams
    unassignTeam(argResident);

    //add to red team and change teamColor
    redTeam.push(argResident);
    argResident.team = 'red';

    //change dropdown
    var dropdown = document.getElementById('dropdown-' + argResident.name);
    for (let option of dropdown.options) {
        if (option.value == argResident.team) option.selected = true;
        else option.selected = false;
    }
    dropdown.dispatchEvent(new Event("change"));  //trigger 'onchange' function to change the dropdown color
}
function pushEdu(argResident) {

    //unassign from all teams
    unassignTeam(argResident);

    //add to edu team and change teamColor
    eduTeam.push(argResident);
    argResident.team = 'edu';

    //change dropdown
    var dropdown = document.getElementById('dropdown-' + argResident.name);
    for (let option of dropdown.options) {
        if (option.value == argResident.team) option.selected = true;
        else option.selected = false;
    }
    dropdown.dispatchEvent(new Event("change"));  //trigger 'onchange' function to change the dropdown color
}
function updateDropdowns() {

    var dropdown;

    //clear all dropboxes
    for (let resident of residentsAll) {
        dropdown = document.getElementById('dropdown-' + resident.name);
        for (let option of dropdown.options) {
            option.selected = false;
        }
        dropdown.dispatchEvent(new Event("change"));  //trigger 'onchange' function to change the dropdown color
    }

    //assign default dropdown based on team
    for (let resident of residents) {
        dropdown = document.getElementById('dropdown-' + resident.name);
        for (let option of dropdown.options) {
            if (option.value == resident.teamColor) {
                option.selected = true;
            }
        }
        dropdown.dispatchEvent(new Event("change"));  //trigger 'onchange' function to change the dropdown color
    }
}
function resetResidents() {

    //clear residents
    residents = [];

    resetTeamAssignments();
}
function vacationMode(argName) {

    var availability = 0;
    var checkbox;
    var dropdown = document.getElementById('dropdown-' + argName);

    //determine new total availability
    for (let i = 0; i < 4; i++) {
        checkbox = document.getElementById('checkbox-' + argName + '-' + i);
        if (checkbox.checked) availability++;
    }

    //reset options if resident available and was NOT previously
    if (availability > 0 && dropdown.options.length == 1) {

        dropdown.innerHTML = '';

        var values = ['---', 'blue', 'red', 'edu'];
        var options = [];
        for (let i = 0; i < values.length; i++) {
            options[i] = document.createElement('option');
            options[i].innerHTML = values[i];

            if (values[i] == 'blue') {
                options[i].setAttribute('class', 'blue-text');
            }
            else if (values[i] == 'red') {
                options[i].setAttribute('class', 'red-text');
            }
            else {
                options[i].setAttribute('class', 'black-text');
            }

            dropdown.append(options[i]);
        }
        dropdown.onchange = function () {

            var argResident;

            //find resident
            for (let resident of residents) {
                if (resident.name == argName) {
                    argResident = resident;
                }
            }

            //update team
            if (dropdown.value == 'blue') pushBlue(argResident);
            else if (dropdown.value == 'red') pushRed(argResident);
            else if (dropdown.value == 'edu') pushEdu(argResident);
            else unassignTeam();

            //update color
            if (dropdown.value == 'blue') dropdown.setAttribute('class', 'blue-text');
            else if (dropdown.value == 'red') dropdown.setAttribute('class', 'red-text');
            else dropdown.setAttribute('class', 'black-text');
        };
    }

    //remove options if resident newly unavailable
    else if (availability == 0 && dropdown.options.length != 1) {

        dropdown.innerHTML = '';

        var values = ['---'];
        var options = [];
        for (let i = 0; i < values.length; i++) {
            options[i] = document.createElement('option');
            options[i].innerHTML = values[i];

            if (values[i] == 'blue') {
                options[i].setAttribute('class', 'blue-text');
            }
            else if (values[i] == 'red') {
                options[i].setAttribute('class', 'red-text');
            }
            else {
                options[i].setAttribute('class', 'black-text');
            }

            dropdown.append(options[i]);
        }
        dropdown.onchange = function () {

            var argResident;

            //find resident
            for (let resident of residents) {
                if (resident.name == argName) {
                    argResident = resident;
                }
            }

            //update team
            if (dropdown.value == 'blue') pushBlue(argResident);
            else if (dropdown.value == 'red') pushRed(argResident);
            else if (dropdown.value == 'edu') pushEdu(argResident);
            else unassignTeam();

            //update color
            if (dropdown.value == 'blue') dropdown.setAttribute('class', 'blue-text');
            else if (dropdown.value == 'red') dropdown.setAttribute('class', 'red-text');
            else dropdown.setAttribute('class', 'black-text');
        };
    }
}
function resetTeamAssignments() {

    //clear team assignments
    blueTeam = [];
    redTeam = [];
    for (let resident of residents) {
        resident.team = '---';
    }
    updateDropdowns();

    clearSchedule();
}
function clearSchedule() {

    //clear schedule - recursively clear stats
    month = [];
    document.getElementById('schedule').innerHTML = '';     //clear month/schedule

    clearStats();
}
function clearStats() {

    stats = {};
    document.getElementById('stats-title').innerHTML = '';  //clear stats title
    document.getElementById('stats').innerHTML = '';        //clear stats
}




function sortByPGYHigh(argResidents) {

    argResidents.sort(function (low, high) {

        if (low.PGY == high.PGY) {

            return Math.random() - 0.5;
        }

        return high.PGY - low.PGY;
    })
}
function sortByAvailabilityHigh(argResidents) {

    argResidents.sort(function (low, high) {
        if (high.availability[4] == low.availability[4]) return high.PGY - low.PGY;
        else return high.availability[4] - low.availability[4];
    })
}
function sortByShifts(argResidents) {

    argResidents.sort(function (low, high) {
        if (low.shifts == high.shifts) return low.PGY - high.PGY;
        else return low.shifts - high.shifts;
    })
}
function sortByConsults(argResidents) {

    argResidents.sort(function (low, high) {

        if (low.consults == high.consults) {

            return low.PGY - high.PGY;
        }

        return low.consults - high.consults;
    })
}
function sortByWeekends(argResidents) {

    argResidents.sort(function (low, high) {

        if (low.weekends == high.weekends) {

            return low.shifts - high.shifts;
        }

        return low.weekends - high.weekends;
    })
}
function sortByNights(argResidents) {

    argResidents.sort(function (low, high) {

        if (low.nights == high.nights) {

            return low.shifts - high.shifts;
        }

        return low.nights - high.nights;
    })
}
function sortByShiftsThisWeek(argResidents, argWeek) {

    argResidents.sort(function (low, high) {
        if (low.weekly.shifts[argWeek] == high.weekly.shifts[argWeek]) return low.shifts - high.shifts;
        else return low.weekly.shifts[argWeek] - high.weekly.shifts[argWeek];
    })
}
