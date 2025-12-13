//-----------------------------

/* global data */ {
    var month = [];
    var residents = [];
    var blueTeam = [];
    var redTeam = [];
    var eduTeam = [];
    var positions = ['blueChief', 'blueStaff', 'redChief', 'redStaff', 'consult', 'nightSr', 'nightJr'];
    var shiftTypes = ['shifts', 'consults', 'weekends', 'nights'];
    var stats = [];
}

//-----------------------------

class Resident {

    constructor(argName, argPGY) {

        this.name = argName;
        this.PGY = argPGY;

        this.team = '---';
        this.availability = [1, 1, 1, 1];

        for (let shiftType of shiftTypes) {
            this[shiftType] = [0, 0, 0, 0];
        }
    }

    _shifts() {
        var total = 0;
        for (let subtotal of this.shifts) {
            total += subtotal;
        }
        return total;
    }
    _consults() {
        var total = 0;
        for (let subtotal of this.consults) {
            total += subtotal;
        }
        return total;
    }
    _weekends() {
        var total = 0;
        for (let subtotal of this.weekends) {
            total += subtotal;
        }
        return total;
    }
    _nights() {
        var total = 0;
        for (let subtotal of this.nights) {
            total += subtotal;
        }
        return total;
    }
    _availability() {
        var total = 0;
        for (let subtotal of this.availability) {
            total += subtotal;
        }
        return total;
    }

    canChief() {
        if (this.PGY == 5) return true;
        else return false;
    }
    canChiefWeekend() {

    if (this.PGY == 4) return true;
    if (this.PGY == 5 && this.team == 'edu') return true;

    else return false;
    }
    canNightSr() {

        if (this.PGY == 3 || this.PGY == 4) return true;
        else return false;
    }
    canConsult() {

        if (this.PGY > 1 && this.PGY < 5) return true;
        else return false;
    }
    canSr() {

        if (this.PGY > 2) return true;
        else return false;
    }
    canJr() {

        if (this.PGY < 3) return true;
        else return false;
    }


    isAvailable(argDay) {

        var vacationToday = false;
        var workingToday = false;
        var workingYesterdayNight = false;

        //check if on vacation
        if (this.isOnVacation(argDay)) vacationToday = true;

        //check if working today
        if (this.isWorking(argDay)) workingToday = true;

        //check if working yesterday night
        //   ONLY if there was a night shift yesterday (today is Sat/Sun)
        if (argDay.dayNum() == 5 || argDay.dayNum() == 6) {
            if (this.isWorkingNight(argDay.yesterday())) workingYesterdayNight = true;
        }

        if (!vacationToday && !workingToday && !workingYesterdayNight) return true;
        else return false;
    }
    isWorking(argDay) {

        for (let position of positions) {
            if (argDay[position].includes(this)) return true;
        }

        return false;
    }
    isWorkingNight(argDay) {

        //check if working night Sr/Jr today
        if (argDay.nightSr.includes(this)) return true;
        if (argDay.nightJr.includes(this)) return true;
        else return false;
    }
    isOnVacation(argDay) {
        if (this.availability[argDay.weekNum()] == 0) return true;
        else return false;
    }

    color() {
        if (this.team == 'blue') return 'blue';
        if (this.team == 'red') return 'red';
        else return 'black';
    }
}
class Day {

    constructor(argDayNum) {

        this.num = argDayNum;

        for (let position of positions) {
            this[position] = [];
        }
    }

    weekNum() {
        return Math.trunc(this.num / 7);
    }
    dayNum() {
        return this.num % 7;
    }
    yesterday() {
        if (this.num == 0) return null;
        else return month[this.num - 1];
    }
    tomorrow() {
        if (this.num == 27) return null;
        else return month[this.num + 1];
    }
    isFriSat() {
        if (this.dayNum() == 4 || this.dayNum() == 5) return true;
        else return false;
    }
    isSatSun() {
        if (this.dayNum() == 5 || this.dayNum() == 6) return true;
        else return false;
    }
}

//-----------------------------

function load() {

    //verify no duplicate names
    if (hasDuplicateNames()) {
        document.body.innerHTML = '';
        return;
    }

    //output list of residents with full availability
    importResidents();

    //for efficient testing
    assignTeams();
    generateSchedule();

}
function hasDuplicateNames() {

    var names = [];
    for (let resident of residentsAll) {
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
function importResidents() {

    //import residents from file to array of Resident objects
    residents = [];
    for (let resident of residentsAll) {
        residents.push(new Resident(resident.name, resident.PGY));
    }

    //display residents in html for selection
    for (let resident of residents) {
        listResident(resident);
    }

    //update and display total availability
    updateAvailability();
}
function listResident(argResident) {

    var name = argResident.name;
    var PGY = argResident.PGY;

    var form = document.getElementById('all-residents');
    var label = document.createElement('label');
    var span = document.createElement('span');

    //name & PGY
    span.textContent = PGY + ' - ' + name;
    span.setAttribute('class', 'resident-availability-name'); //set standard width
    label.appendChild(span);

    //availbility checkboxes (4)
    var checkboxes = [];
    for (let i = 0; i < 4; i++) {
        checkboxes[i] = document.createElement('input');
        checkboxes[i].type = 'checkbox';
        checkboxes[i].checked = true;
        checkboxes[i].name = 'resident-availability-checkbox'; //the handle to get all checkboxes later
        checkboxes[i].setAttribute('id', 'checkbox-' + name + '-' + i);
        checkboxes[i].setAttribute('fName', name);
        checkboxes[i].setAttribute('PGY', PGY);
        checkboxes[i].setAttribute('week', i);

        //update resident availability and dropdown options if appropriate - links to clear team, schedule, stats
        checkboxes[i].addEventListener('change', updateAvailability);

        label.append(checkboxes[i]);
    }

    //team dropdown
    label.append(createDropdown(argResident));

    form.appendChild(label);
    form.appendChild(document.createElement('br'));
}
function createDropdown(argResident, argStatus = 'full') {

    var dropdown;
    var values = ['---', 'blue', 'red', 'edu'];
    var options = [];
    if (argStatus == 'empty') values = ['---'];

    //create dropdown elements
    dropdown = document.createElement('select');
    dropdown.setAttribute('id', 'dropdown-' + argResident.name); //handle to change visible dropdown option once teams are assigned
    for (let i = 0; i < values.length; i++) {
        options[i] = document.createElement('option');
        options[i].innerHTML = values[i];

        if (values[i] == 'blue' || values[i] == 'red') {
            options[i].setAttribute('class', values[i] + '-text');
        }
        else options[i].setAttribute('class', 'black-text');
        dropdown.append(options[i]);
    }

    //link on change functions
    dropdown.onchange = function () {

        //update Resident object
        unassignTeam(argResident);
        if (dropdown.value == 'blue') pushBlue(argResident);
        else if (dropdown.value == 'red') pushRed(argResident);
        else if (dropdown.value == 'edu') pushEdu(argResident);

        //update color
        if (dropdown.value == 'blue') dropdown.setAttribute('class', 'blue-text');
        else if (dropdown.value == 'red') dropdown.setAttribute('class', 'red-text');
        else dropdown.setAttribute('class', 'black-text');

        //update team counts - based on resident Objects
        updateTeamCount();

        //clear schedule (along with resident shifts and stats)
        clearSchedule();
    };

    return dropdown;
}

function updateAvailability() {

    var checkbox;
    var availability;
    var existingDropdown;
    var newDropdown;

    //update each resident
    for (let resident of residents) {

        //update resident Object
        resident.availability = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
            checkbox = document.getElementById('checkbox-' + resident.name + '-' + i);
            if (checkbox.checked) resident.availability[i] = 1;
        }

        //update dropdown options
        var existingDropdown = document.getElementById('dropdown-' + resident.name);
        availability = resident._availability();
        if (availability > 0) newDropdown = createDropdown(resident);
        else newDropdown = createDropdown(resident, 'empty');
        existingDropdown.parentNode.replaceChild(newDropdown, existingDropdown);
    }

    //update resident total count - based on resident Objects
    updateTotalCount();

    //link to reset team assignments
    resetTeamAssignments();
}
function updateTotalCount() {

    var totalCountHTML;
    var total = 0;

    for (let resident of residents) {
        total += (resident._availability() / 4.0);
    }

    totalCountHTML = document.getElementById('total-count');
    totalCountHTML.innerHTML = 'Residents Available: ' + total;
}
function resetTeamAssignments() {

    //reset all dropboxes
    for (let resident of residents) {
        changeDropdown(resident, 'reset');
    }
}
function updateTeamCount() {

    //update team count based on length of team lists
    var teamCountHTML = document.getElementById('team-count');
    teamCountHTML.innerHTML = '';
    teamCountHTML.innerHTML += '&nbsp&nbsp' + 'Blue Team: ' + blueTeam.length + '<br>';
    teamCountHTML.innerHTML += '&nbsp&nbsp' + 'Red Team: ' + redTeam.length + '<br>';
    teamCountHTML.innerHTML += '&nbsp&nbsp' + 'Edu Team: ' + eduTeam.length;
}
function clearSchedule() {

    //clear month Object
    month = [];

    //clear display
    document.getElementById('schedule').innerHTML = '';

    //reset resident shifts - but keep team assignments and availability
    for (let resident of residents) {
        for (let shiftType of shiftTypes) {
            resident[shiftType] = [0, 0, 0, 0];
        }
    }

    //link to clear stats
    clearStats();
}
function clearStats() {

    stats = [];
    document.getElementById('stats-title').innerHTML = '';
    document.getElementById('stats').innerHTML = '';
}

function changeDropdown(argResident, argTeam = 'reset') {

    //change dropdown
    var dropdown = document.getElementById('dropdown-' + argResident.name);
    for (let option of dropdown.options) {
        if (argTeam != 'reset' && option.value == argTeam) option.selected = true;
        else option.selected = false;
    }

    //trigger 'onchange' function to change the dropdown color, update resident Object, clear schedule/stats
    dropdown.dispatchEvent(new Event("change"));
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

    //add to blue team and change teamColor
    blueTeam.push(argResident);
    argResident.team = 'blue';
}
function pushRed(argResident) {

    //add to red team and change teamColor
    redTeam.push(argResident);
    argResident.team = 'red';
}
function pushEdu(argResident) {

    //add to edu team and change teamColor
    eduTeam.push(argResident);
    argResident.team = 'edu';
}

function assignTeams() {

    var fullTime = [];
    var partTime = [];
    var noTime = [];
    var chiefs = [];
    var availability = 0;
    var sorter = 0;
    var bluePoints = 0;
    var redPoints = 0;


    //clear team assignments (links to dropdowns-schedule-shifts-stats)
    resetTeamAssignments();

    //set up extra resident arrays
    sortByPGYHigh(residents);
    for (let resident of residents) {
        //separate based on availability
        availability = resident._availability();
        if (availability == 4) fullTime.push(resident);
        else if (availability > 0) partTime.push(resident);
        else noTime.push(resident);
        //get chiefs
        if (resident.PGY == 5) chiefs.push(resident);
    }

    //choose edu chief based on least availability
    sortByAvailabilityHigh(chiefs);
    if (chiefs.length == 3) changeDropdown(chiefs[2], 'edu');

    //assign all full time residents
    for (let resident of fullTime) {

        //set sorter (negative -> blue, positive -> red)
        sorter = (blueTeam.length - redTeam.length);
        if (sorter == 0) sorter = rand();

        //assign one chief to each team, exclude eduChief
        //this assumes at least 2 chiefs have full availability
        if (resident.PGY == 5) {
            if (resident.team != 'edu') {
                if (sorter < 0) changeDropdown(resident, 'blue');
                else changeDropdown(resident, 'red');
            }
            continue;
        }

        //even out team size if needed
        if (blueTeam.length < redTeam.length) changeDropdown(resident, 'blue');
        else if (blueTeam.length > redTeam.length) changeDropdown(resident, 'red');

        //otherwise each team should have one resident from each PGY
        else {
            if (resident.PGY != blueTeam[blueTeam.length - 1].PGY) changeDropdown(resident, 'blue');
            else if (resident.PGY != redTeam[redTeam.length - 1].PGY) changeDropdown(resident, 'red');

            //otherwise go random
            else {
                if (sorter < 0) changeDropdown(resident, 'blue');
                else changeDropdown(resident, 'red');
            }
        }
    }

    //assign part time residents to a team - simply try to equalize available weeks
    sortByAvailabilityHigh(partTime)
    for (let resident of partTime) {

        //set sorter (negative -> blue, positive -> red)
        sorter = (bluePoints - redPoints);
        if (sorter == 0) sorter = rand();

        //assign accordingly
        if (sorter < 0) {
            changeDropdown(resident, 'blue');
            bluePoints += resident._availability();
        }
        else {
            changeDropdown(resident, 'red');
            redPoints += resident._availability();
        }
    }
}

function rand() {

    var randNum = 0;

    //random number [0, 1)
    randNum = Math.random();

    //random number [-1, 1)
    randNum = randNum * 2 - 1;

    //don't allow return 0
    if (randNum == 0) return rand();

    return randNum;
}

//------------------------------------------

function generateSchedule() {

    //clear schedule, month Object, resident shifts, stats
    clearSchedule();

    //scaffold month Object
    for (let i = 0; i < 28; i++) {
        month.push(new Day(i));
    }

    //fill month Object
    populateMonth();

    //display schedule
    printFullSchedule();

    //update and print stats
    updateStats();
}

function populateMonth() {

    var day;

    for (let week = 0; week < 4; week++) {

        //1. assign weekday chiefs
        for (let i = week * 7; i < (week * 7) + 5; i++) {
            day = month[i];
            day.blueChief[0] = assignShift(chooseChief(blueTeam, day), day);
            day.redChief[0] = assignShift(chooseChief(redTeam, day), day);
        }

        //2. assign weekend chiefs (edu chief and one 4th year)
        for (let i = (week * 7) + 5; i < (week * 7) + 7; i++) {
            day = month[i];
            day.blueChief[0] = assignWeekend(chooseChiefWeekend(blueTeam, day), day);
            day.redChief[0] = assignWeekend(chooseChiefWeekend(redTeam, day), day);
        }

        //3. assign night Sr & Jr. No 24hr shifts. NightSr is non weekend 3-4th year)
        for (let i = (week * 7) + 4; i < (week * 7) + 6; i++) {
            day = month[i];
            day.nightSr[0] = assignNight(chooseNightSr(residents, day), day);
            day.nightJr[0] = assignNight(chooseNightJr(residents, day), day);
        }

        //4. assign weekend staff
        for (let i = (week * 7) + 5; i < (week * 7) + 7; i++) {
            day = month[i];
            day.blueStaff[0] = assignWeekend(chooseWeekend(blueTeam, day), day);
            day.redStaff[0] = assignWeekend(chooseWeekend(redTeam, day), day);
        }

        //5. assign consults
        for (let i = week * 7; i < (week * 7) + 7; i++) {
            day = month[i];
            day.consult[0] = assignConsult(chooseConsult(residents, day), day);
        }

        //6. assign week day shifts
        for (let i = week * 7; i < (week * 7) + 5; i++) {

            day = month[i];

            //seniors
            day.blueStaff[0] = assignShift(chooseSr(blueTeam, day), day);
            day.redStaff[0] = assignShift(chooseSr(redTeam, day), day);

            //juniors
            day.blueStaff[1] = assignShift(chooseJr(blueTeam, day), day);
            day.redStaff[1] = assignShift(chooseJr(redTeam, day), day);
        }
    }
}

function assignShift(argResident, argDay) {

    if (!isEmpty(argResident)) {
        var week = argDay.weekNum();
        argResident.shifts[week] += 1;

        return argResident;
    }

    else return null;
}
function assignWeekend(argResident, argDay) {

    if (!isEmpty(argResident)) {
        var week = argDay.weekNum();
        argResident.weekends[week] += 1;
    }

    return assignShift(argResident, argDay);
}
function assignNight(argResident, argDay) {

    if (!isEmpty(argResident)) {
        var week = argDay.weekNum();
        argResident.nights[week] += 1;
    }

    return assignWeekend(argResident, argDay);
}
function assignConsult(argResident, argDay) {

    if (!isEmpty(argResident)) {
        var week = argDay.weekNum();
        argResident.consults[week] += 1;
    }

    return assignShift(argResident, argDay);
}
function unassign(argResident, argDay, argPosition) {

    var week = argDay.weekNum();

    argResident.shifts[week] -= 1;

    if (argPosition.includes('night')) argResident.nights[week] -= 1;
    if (argPosition.includes('consult')) argResident.consults[week] -= 1;
    if (argDay.isSatSun()) argResident.weekends[week] -= 1;
    
}


function sortByPGYHigh(argResidents) {

    argResidents.sort(function (low, high) {

        var num = 0;

        //sort PGY high to low
        num = high.PGY - low.PGY;
        if (num != 0) return num;

        //if equal return random
        num = rand();
        return num;
    });
}
function sortByAvailabilityHigh(argResidents) {

    argResidents.sort(function (low, high) {

        var num = 0;

        //sort high to low
        num = high._availability() - low._availability();
        if (num != 0) return num;

        //if equal return PGY high to low
        num = high.PGY - low.PGY;
        if (num != 0) return num;

        //if equal return random
        num = rand();
        return num;
    });
}
function sortByWeekends(argResidents, argDay) {

    argResidents.sort(function (low, high) {

        var num = 0;
        var week = argDay.weekNum();

        //sort low to high by weighted average weekends worked this month
        num = (low._weekends() / low._availability()) - (high._weekends() / high._availability());
        if (num != 0) return num;

        //if equal, sort low to high weekends worked this week
        num = low.weekends[week] - high.weekends[week];
        if (num != 0) return num;

        //if equal, sort by weighted average shifts
        num = (low._shifts() / low._availability()) - (high._shifts() / high._availability());
        if (num != 0) return num;

        //if equal, sort low to high shifts worked this week
        num = low.shifts[week] - high.shifts[week];
        if (num != 0) return num;

        //if equal, sort low-high PGY
        num = low.PGY - high.PGY;
        if (num != 0) return num;

        //if equal, return random
        num = rand();
        return num;
    });
}
function sortByNights(argResidents, argDay) {

    argResidents.sort(function (low, high) {

        var num = 0;
        var week = argDay.weekNum();

        //sort low to high weighted average nights
        num = (low._nights() / low._availability()) - (high._nights() / high._availability());
        if (num != 0) return num;

        //if equal, sort low-high nights this week
        num = low.nights[week] - high.nights[week];
        if (num != 0) return num;

        //if equal, sort by weighted average shifts
        num = (low._shifts() / low._availability()) - (high._shifts() / high._availability());
        if (num != 0) return num;

        //if equal, sort low-high shifts this week
        num = low.shifts[week] - high.shifts[week];
        if (num != 0) return num;

        //if equal, sort low-high PGY
        num = low.PGY - high.PGY;
        if (num != 0) return num;

        //if equal, return random
        num = rand();
        return num;
    });
}
function sortByConsults(argResidents, argDay) {

    argResidents.sort(function (low, high) {

        var num = 0;
        var week = argDay.weekNum();

        //sort low to high weighted average consults
        num = (low._consults() / low._availability()) - (high._consults() / high._availability());
        if (num != 0) return num;

        //if equal, sort low-high consults this week
        num = low.consults[week] - high.consults[week];
        if (num != 0) return num;

        //if equal, sort by weighted average shifts
        num = (low._shifts() / low._availability()) - (high._shifts() / high._availability());
        if (num != 0) return num;

        //if equal, sort low-high shifts this week
        num = low.shifts[week] - high.shifts[week];
        if (num != 0) return num;

        //if equal, sort low-high PGY
        num = low.PGY - high.PGY;
        if (num != 0) return num;

        //if equal, return random
        num = rand();
        return num;

    });
}
function sortByShifts(argResidents, argDay) {

    argResidents.sort(function (low, high) {

        var num = 0;
        var week = argDay.weekNum();

        //sort by weighted average shifts
        num = (low._shifts() / low._availability()) - (high._shifts() / high._availability());
        if (num != 0) return num;

        //if equal, sort low-high shifts this week
        num = low.shifts[week] - high.shifts[week];
        if (num != 0) return num;

        //if equal, sort low-high PGY
        num = low.PGY - high.PGY;
        if (num != 0) return num;

        //if equal, return random
        num = rand();
        return num;
    });
}
function sortByShiftsThisWeek(argResidents, argDay) {

    argResidents.sort(function (low, high) {

        var num = 0;
        var week = argDay.weekNum();

        //sort low-high shifts this week
        num = low.shifts[week] - high.shifts[week];
        if (num != 0) return num;

        //if equal, sort low-high PGY
        num = low.PGY - high.PGY;
        if (num != 0) return num;

        //if equal, return random
        num = rand();
        return num;
    });
}

function isEmpty(argResident) {

    if (argResident == null) return true;

    else return false;
}

function chooseChief(argTeam, argDay) {

    sortByPGYHigh(argTeam);
    for (let resident of argTeam) {
        if (resident.canChief() && resident.isAvailable(argDay)) return resident;
    }

    return null;
}
function chooseChiefWeekend(argTeam, argDay) {

    //if Sunday, keep weekend senior same as Sat
    if (argDay.dayNum() == 6) {
        if (argTeam == blueTeam) return argDay.yesterday().blueChief[0];
        else if (argTeam == redTeam) return argDay.yesterday().redChief[0];
        else return null;
    }
    //should education chief be weekend senior? (based on team + even/odd week)
    sortByWeekends(eduTeam, argDay);
    for (let resident of eduTeam) {
        if (resident.canChiefWeekend() && resident.isAvailable(argDay)) {
            if (argTeam == blueTeam && argDay.weekNum() % 2 == 0) return resident;
            if (argTeam == redTeam && argDay.weekNum() % 2 == 1) return resident;
        }
    }

    //otherwise determine 4th year weekend senior
    sortByWeekends(argTeam, argDay);
    for (let resident of argTeam) {
        if (resident.canChiefWeekend() && resident.isAvailable(argDay)) return resident;
    }

    return null;
}
function chooseNightSr(argTeam, argDay) {

    var weekendChiefs = [];
    var blueWeekendChief = null;
    var redWeekendChief = null;
    var nightPool = [];

    //find weekend chiefs
    blueWeekendChief = argDay.tomorrow().blueChief[0];
    if (!isEmpty(blueWeekendChief)) weekendChiefs.push(blueWeekendChief);
    redWeekendChief = argDay.tomorrow().redChief[0];
    if (!isEmpty(redWeekendChief)) weekendChiefs.push(redWeekendChief);

    //find all possible night seniors
    for (let resident of argTeam) {
        if (resident.canNightSr() && !weekendChiefs.includes(resident)) nightPool.push(resident);
    }

    //choose from all candidates, ok to work 2 nights in a row if needed
    sortByNights(nightPool, argDay);
    for (let resident of nightPool) {
        if (!resident.isWorking(argDay) && !resident.isOnVacation(argDay)) return resident;
    }

    return null;
}
function chooseNightJr(argTeam, argDay) {

    sortByNights(argTeam, argDay);

    //ok to work 2 nights in a row
    for (let resident of argTeam) {
        if (resident.canJr() && !resident.isWorking(argDay) && !resident.isOnVacation(argDay)) return resident;
    }

    return null;
}
function chooseWeekend(argTeam, argDay) {

    sortByWeekends(argTeam, argDay);

    for (let resident of argTeam) {
        if (resident.canJr() && resident.isAvailable(argDay)) return resident;
    }

    return null;
}
function chooseConsult(argTeam, argDay) {

    sortByConsults(argTeam, argDay);

    for (let resident of argTeam) {
        if (resident.canConsult() && resident.isAvailable(argDay)) return resident;
    }

    return null;

}
function chooseSr(argTeam, argDay) {

    sortByShifts(argTeam, argDay);

    for (let resident of argTeam) {
        if (resident.canSr() && resident.isAvailable(argDay)) return resident;
    }

    return null;
}
function chooseJr(argTeam, argDay) {

    sortByShifts(argTeam, argDay);

    for (let resident of argTeam) {
        if (resident.canJr() && resident.isAvailable(argDay)) return resident;
    }

    return null;
}

// Call Shifts
/* 
PGY-5
    weekday chiefs can work Fri call (would be 6 shifts)
    edu chief never works call (always weekend chief)
PGY-4
    can work if NOT weekend chief
PGY 3, 2, 1
    no restriction

1. assign weekday chiefs
2. assign weekend chiefs (eduChief and a PGY-4)
3. assign call Sr (fri + sat)
4. assign call Jr (fri + sat)

canCallSr: PGY 3-5
canCallJr: PGY 1-3 (should expand to allow PGY-3 to Jr)

Sort
* low-high # calls
* low-high # weekends (if not PGY-5)
* low-high # shifts


Sometimes you they allow a standalone call shift?

Could just expand current algorithm:
* allow 24hr shifts
* allow PGY-5 to work night
* don't allow two nights in a row
* don't allow day shift after night shift
*/

//Golden Weekend
/*
Golden Weekend
* there are 14 weekend shifts (10 if you do 4x24hr shifts)
*     2x2 weekend chiefs
*     2x2 weekend Jrs
*     1x2 call Sr
*     1x2 call Jr
*     1x2 consults
* sometimes there are only 10 people on service
* everyone should get one golden weekend per month
* this means 2-3 people need to get a golden weekend each week
* meaning there might only be 7 people to work the weekend shifts
* so 3 people may have to work multiple weekend shifts

*/






function printFullSchedule() {

    var schedule = document.getElementById('schedule');
    var week;

    //clear display
    schedule.innerHTML = "";

    //make each week
    for (let weekNum = 0; weekNum < 4; weekNum++) {
        week = makeWeek(weekNum);
        schedule.append(week);
    }
}
function makeWeek(argWeekNum) {

    var weekHTML;
    var dateRow;
    var assignmentRow;
    var floatPoolRow;

    //create week container
    weekHTML = document.createElement('div');

    //create date/day headers row
    dateRow = makeDateRow();
    weekHTML.append(dateRow);

    //create assignments row
    assignmentRow = makeAssignmentsRow(argWeekNum);
    weekHTML.append(assignmentRow);

    //create float pool row
    floatPoolRow = makeFloatPoolRow(argWeekNum);
    weekHTML.append(floatPoolRow);

    return weekHTML;
}
function makeDateRow() {

    var row;
    var cell;

    row = document.createElement('tr');

    for (let day = 0; day < 7; day++) {
        cell = makeDateCell(day);
        row.append(cell);
    }

    return row;
}
function makeDateCell(argDay) {

    var cell;
    var dayName;
    var daysOfTheWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    dayName = daysOfTheWeek[argDay];

    cell = document.createElement('th');
    cell.innerHTML += dayName;

    return cell;
}
function makeAssignmentsRow(argWeek) {

    var row;
    var cell;

    row = document.createElement('tr');
    for (let day = argWeek * 7; day < (argWeek * 7) + 7; day++) {
        cell = makeAssignmentCell(argWeek, day);
        row.append(cell);
    }

    return row;
}
function makeAssignmentCell(argWeek, argDay) {

    var cell;
    var wrapper;
    var positionsColumn;
    var wrapperTeams;   //teams (blue and red)
    var wrapperSpecial; //consults & nights
    var namesColumn;
    var textColor;
    var renamePosition;
    var positionHTML;
    var nameHTML;
    var tooltipHTML;

    //cell scaffold
    cell = document.createElement('td');
    cell.setAttribute('id', 'day' + argDay);

    //wrapper scaffold - need single element to align colums to top of cell
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'wrapper');

    //scaffold positions column
    positionsColumn = document.createElement('div');
    //positionsColumn.setAttribute('id', 'day' + argDay + '-positions');
    positionsColumn.setAttribute('class', 'position-column');
    wrapperTeams = document.createElement('div');
    wrapperTeams.setAttribute('class', 'wrapper-teams');
    //wrapperTeams.setAttribute('id', 'day' + argDay + '-wrapper-teams')
    wrapperSpecial = document.createElement('div');
    wrapperSpecial.setAttribute('class', 'wrapper-special');
    //wrapperSpecial.setAttribute('id', 'day' + argDay + '-wrapper-special');
    positionsColumn.append(wrapperTeams, wrapperSpecial);

    //scaffold names column
    namesColumn = document.createElement('div');
    namesColumn.setAttribute('id', 'day' + argDay + '-names');
    namesColumn.setAttribute('class', 'name-column');

    wrapperTeams.innerHTML = '';
    wrapperSpecial.innerHTML = '';
    namesColumn.innerHTML = '';

    //output each position
    for (let position of positions) {
        for (let i = 0; i < month[argDay][position].length; i++) {

            let resident = month[argDay][position][i];

            if (!isEmpty(resident)) {

                if (position.includes('blue')) textColor = 'blue-text';
                else if (position.includes('red')) textColor = 'red-text';
                else if (position.includes('consult')) textColor = 'purple-text';
                else textColor = 'black-text';

                if (position.includes('Chief')) renamePosition = 'Chief';
                else if (position.includes('Staff')) renamePosition = '&nbsp;';
                else renamePosition = position;

                positionHTML = document.createElement('div');
                positionHTML.setAttribute('class', textColor);
                positionHTML.innerHTML = renamePosition;

                nameHTML = document.createElement('div');
                nameHTML.setAttribute('class', textColor + ' resident ' + resident.name);
                nameHTML.addEventListener('mouseover', () => mouseOver(resident.name));
                nameHTML.addEventListener('mouseout', () => mouseOut(resident.name));
                nameHTML.innerHTML = resident.name;
                nameHTML.addEventListener('click', () => removeResident(resident, month[argDay]));

                tooltipHTML = makeToolTip(resident, argWeek);
                nameHTML.append(tooltipHTML);

                if (position.includes('blue') || position.includes('red')) {
                    wrapperTeams.append(positionHTML);
                }
                else {
                    wrapperSpecial.append(positionHTML);
                }

                namesColumn.append(nameHTML);
            }
        }
    }

    //add children scaffolds to cell
    wrapper.append(positionsColumn, namesColumn);
    cell.append(wrapper);

    return cell;
}
function makeToolTip(argResident, argWeek) {

    var tooltip;

    tooltip = document.createElement('span');
    tooltip.setAttribute('class', 'tooltip');
    tooltip.innerHTML += 'shifts this week: ' + argResident.shifts[argWeek] + '<br>';
    tooltip.innerHTML += 'total shifts: ' + argResident._shifts() + '<br>';
    tooltip.innerHTML += 'total consults: ' + argResident._consults() + '<br>';
    tooltip.innerHTML += 'total weekends: ' + argResident._weekends() + '<br>';
    tooltip.innerHTML += 'total nights: ' + argResident._nights() + '<br>';

    return tooltip;
}
function makeFloatPoolRow(argWeek) {

    var row;
    var cell;
    var floatPool = {};
    var teams = ['blue', 'red', 'edu', '---'];
    var residentHTML;
    var tooltipHTML;

    row = document.createElement('tr');
    for (let day = (argWeek * 7); day < (argWeek * 7) + 7; day++) {

        cell = document.createElement('td');
        cell.setAttribute('id', 'day' + day + '-floatPool');
        cell.innerHTML += 'Available to Work<br>';

        //clear float pools
        for (let team of teams) {
            floatPool[team] = [];
        }

        //find all available residents and separate based on team
        for (let resident of residents) {
            if (resident.isAvailable(month[day])) {
                floatPool[resident.team].push(resident);
            }
        }

        //sort float pools by shifts this week
        for (let team of teams) {
            sortByShiftsThisWeek(floatPool[team], month[day]);
        }

        //output by team - add color, click and mouseover functions
        for (let team of teams) {
            for (let resident of floatPool[team]) {

                //text
                residentHTML = document.createElement('div');
                residentHTML.innerHTML = resident.name;
                residentHTML.innerHTML += ' (' + resident.shifts[argWeek] + ')';

                //color
                residentHTML.setAttribute('class', resident.color() + '-text resident ' + resident.name);

                //events
                residentHTML.addEventListener('click', () => addResident(resident, month[day]));
                residentHTML.addEventListener('mouseover', () => mouseOver(resident.name));
                residentHTML.addEventListener('mouseout', () => mouseOut(resident.name));

                //add tooltip and append
                tooltipHTML = makeToolTip(resident, argWeek);
                residentHTML.append(tooltipHTML);
                cell.append(residentHTML);
            }
        }
        row.append(cell);
    }

    return row;
}

function mouseOver(argName) {

    var elementsToBold = document.querySelectorAll('.' + argName);

    for (let element of elementsToBold) {
        element.style.fontWeight = "bold";
    }
}
function mouseOut(argName) {

    var elementsToUnBold = document.querySelectorAll('.' + argName);

    for (let element of elementsToUnBold) {
        element.style.fontWeight = "normal";
    }
}
function addResident(argResident, argDay) {

    var residentPosition;

    //choose what position to place resident
    residentPosition = choosePosition(argResident, argDay);

    //add to that position
    //assign night
    if (residentPosition.includes('night')) argDay[residentPosition].push(assignNight(argResident, argDay));
    //assign weekend
    else if (argDay.isSatSun()) argDay[residentPosition].push(assignWeekend(argResident, argDay));
    //assign consult
    else if (residentPosition.includes('consult')) argDay[residentPosition].push(assignConsult(argResident, argDay));
    //assign shift
    else argDay[residentPosition].push(assignShift(argResident, argDay));

    //re-output schedule/stats
    printFullSchedule();

    //update and print stats
    updateStats();
}
function choosePosition(resident, day) {

    //choose what position to place resident
    //var teamColor = argResident.teamColor;

    //if resident can be chief or weekend chief, check for chief vacancy
    if (resident.canChief() || (day.isSatSun() && resident.canChiefWeekend())) {
        if (resident.team == 'blue' || resident.team == 'edu') {
            if (day.blueChief.length == 0) return 'blueChief';
        }
        else if (teamColor == 'red' || teamColor == 'black') {
            if (day.redChief.length == 0) return 'redChief';
        }
    }

    //if resident can nightSr, check for nightSr vacancy, check if working tomorrow day
    if (day.isFriSat() && resident.canNightSr()) {
        if (day.nightSr.length == 0) {
            if (!resident.isWorking(day.tomorrow()) || resident.isWorkingNight(day.tomorrow())) {
                return 'nightSr';
            }
        }
    }

    //if resident can nightJr, check for nightJr vacancy, check if working tomorrow
    if (day.isFriSat() && resident.canJr()) {
        if (day.nightJr.length == 0) {
            if (!resident.isWorking(day.tomorrow()) || resident.isWorkingNight(day.tomorrow())) {
                return 'nightJr';
            }
        }
    }

    //if resident can consult, check for consult vacancy
    if (resident.canConsult()) {
        if (day.consult.length == 0) {
            return 'consult';
        }
    }

    //if blue/red, assign to team staff (else assign to smaller team)
    if (resident.team == 'blue') return 'blueStaff';
    else if (resident.team == 'red') return 'redStaff';
    else {
        if (day.blueStaff.length <= day.redStaff.length) return 'blueStaff';
        else residentPosition = 'redStaff';
    }
}
function removeResident(argResident, argDay) {

    var residentPosition;
    var residentIndex;

    //locate resident in day/position
    for (let position of positions) {
        for (let i = 0; i < argDay[position].length; i++) {
            if (argDay[position][i] == argResident) {
                residentPosition = position;
                residentIndex = i;
            }
        }
    }

    //remove resident in Day Object
    argDay[residentPosition].splice(residentIndex, 1);

    //remove shifts from resident Object
    unassign(argResident, argDay, residentPosition);

    //re-output schedule/stats
    printFullSchedule();

    //update and print stats
    updateStats();
}

function updateStats() {
    clearStats();
    getStats();
    outputStats();
}
function getStats() {

    //structure
    /* [week 0]
     *   [shifts]
     *     [0 shifts] = [Danielle, Tiffany]
     *     [1 shifts] = [Alex, Emily]
     *     [2 shifts] = [Amanda, Ferdi]
     *   [consults]
     *   [weekends]
     *   [nights]
     * [week 1]
     * [week 2]
     * [week 3]
     * 
    */

    var count = 0;
    sortByPGYHigh(residents);
    stats = [];

    //scaffold weekly stats at index 0-3
    for (let week = 0; week < 4; week++) {
        stats[week] = {};
        for (let shiftType of shiftTypes) {
            stats[week][shiftType] = [];
            for (count = 0; count < 8; count++) {
                stats[week][shiftType][count] = [];
            }
        }
    }
    //scaffold overall stats at index 4
    stats[4] = {};
    for (let shiftType of shiftTypes) {
        stats[4][shiftType] = [];
        for (count = 0; count < 31; count++) {
            stats[4][shiftType][count] = [];
        }
    }

    //input weekly stats from resident Objects
    for (let week = 0; week < 4; week++) {
        for (let shiftType of shiftTypes) {
            for (let resident of residents) {
                count = resident[shiftType][week];
                stats[week][shiftType][count].push(resident);
            }
        }
    }

    //put overall stats at index 4
    for (let resident of residents) {

        //shifts
        count = resident._shifts();
        stats[4]['shifts'][count].push(resident);

        //consults
        count = resident._consults();
        stats[4]['consults'][count].push(resident);

        //weekends
        count = resident._weekends();
        stats[4]['weekends'][count].push(resident);

        //nights
        count = resident._nights();
        stats[4]['nights'][count].push(resident);
    }
}
function outputStats() {

    var table;
    var row;
    var cell;
    var total;

    //add title Statistics
    document.getElementById('stats-title').innerHTML = 'Statistics';

    //clear stats display
    table = document.getElementById('stats');
    table.innerHTML = '';

    //weekly rows
    for (let week = 0; week < 4; week++) {

        //headers
        row = document.createElement('tr');
        for (let shiftType of shiftTypes) {
            cell = document.createElement('th');
            cell.innerHTML = 'Week ' + (week + 1) + ' - ' + shiftType;
            row.append(cell);
        }
        table.append(row);

        //data
        row = document.createElement('tr');
        for (let shiftType of shiftTypes) {
            total = 0;
            cell = document.createElement('td');
            for (let count = 0; count < stats[week][shiftType].length; count++) {
                cell.innerHTML += count + ': ';
                for (let i = 0; i < stats[week][shiftType][count].length; i++) {
                    let resident = stats[week][shiftType][count][i];
                    if (i != 0) cell.innerHTML += ', ';
                    cell.innerHTML += resident.name;
                    total += count;
                }
                cell.innerHTML += '<br>';
            }
            cell.innerHTML += '<br>Total: ' + total;
            row.append(cell);
        }
        table.append(row);
    }

    //overall row
    for (let i = 0; i < 1; i++) {

        //headers
        row = document.createElement('tr');
        for (let shiftType of shiftTypes) {
            cell = document.createElement('th');
            cell.innerHTML = 'Overall - ' + shiftType;
            row.append(cell);
        }
        table.append(row);

        //data
        row = document.createElement('tr');
        for (let shiftType of shiftTypes) {
            total = 0;
            cell = document.createElement('td');
            for (let count = 0; count < stats[4][shiftType].length; count++) {
                cell.innerHTML += count + ': ';
                for (let i = 0; i < stats[4][shiftType][count].length; i++) {
                    let resident = stats[4][shiftType][count][i];
                    if (i != 0) cell.innerHTML += ', ';
                    cell.innerHTML += resident.name;
                    total += count;
                }
                cell.innerHTML += '<br>';
            }
            cell.innerHTML += '<br>Total: ' + total;
            row.append(cell);
        }
        table.append(row);
    }
}

function toggleSidebar() {

    var sidebarElement = document.getElementById('resident-sidebar');
    var sidebarWidth = window.getComputedStyle(sidebarElement).left;

    if (sidebarWidth == '0px') closeSidebar();
    else openSidebar();
}
function openSidebar() {

    var left = 250;

    document.getElementById("resident-sidebar").style.left = '0px';
    document.getElementById("main").style.marginLeft = (left + 10) + 'px';

    document.getElementById('toggleSidebar').innerHTML = '&#9664;';
}
function closeSidebar() {

    var left = 300;

    document.getElementById("resident-sidebar").style.left = '-' + left + 'px';
    document.getElementById("main").style.marginLeft = "0";

    document.getElementById('toggleSidebar').innerHTML = '&#9654;';
}



