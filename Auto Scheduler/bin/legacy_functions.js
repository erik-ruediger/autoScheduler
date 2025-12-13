//-----------------------------

var month = [];
var numWeeks = 0;
var residents = []; 
var blueTeam = [];
var redTeam = [];
var positions = ['blueChief', 'blueSr', 'blueJr', 'redChief', 'redSr', 'redJr', 'consult', 'nightSr', 'nightJr'];
var daysOfTheWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
var eduChief;

//-----------------------------

function updateSelectedNames() {
    
    var selectedNames = document.querySelectorAll('input[name="resident"]:checked');
    var selectedNamesList = document.getElementById('selected-names');
    selectedNamesList.innerHTML = '';
    var chiefs = document.getElementById('education-chief');
    chiefs.innerHTML = '';
    var chiefCount = 0;

    for (var i = 0; i < selectedNames.length; i++) {
        var name = selectedNames[i].getAttribute('fName');
        var PGY = selectedNames[i].getAttribute('PGY');
        var listItem = document.createElement('li');
        var nameWithPGY = document.createElement('span');
        nameWithPGY.classList.add('name-with-PGY');
        nameWithPGY.textContent = name + ' (' + PGY + ')';
        listItem.appendChild(nameWithPGY);
        selectedNamesList.appendChild(listItem);


        if(PGY==5) {
            var input = document.createElement('input');
            input.setAttribute("type", "radio");
            input.setAttribute("id", 'chief'+chiefCount);
            input.setAttribute("name", 'eduChief')
            input.setAttribute("value", name);

            //set third chief selected by default
            if(chiefCount == 2) {
                input.setAttribute("checked", true);
            }

            var label = document.createElement('label');
            label.setAttribute("for", 'chief'+chiefCount);
            label.innerHTML = name;

            chiefs.appendChild(input);
            chiefs.appendChild(label);
            chiefs.appendChild(document.createElement('br'));

            chiefCount++;
        }
    }
}
function addName(argName, argPGY) {
    var name = argName;
    var PGY = argPGY;

    var form = document.getElementById('all-residents');
    var label = document.createElement('label');
    var checkbox = document.createElement('input');
    var span = document.createElement('span');
    
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.name = 'resident';
    checkbox.setAttribute('fName', name);
    checkbox.setAttribute('PGY', PGY);
    checkbox.addEventListener('change', updateSelectedNames);
    span.textContent = name + ' (' + PGY + ')';
    
    label.appendChild(checkbox);
    label.appendChild(span);
    form.appendChild(label);
    form.appendChild(document.createElement('br'));

}

//-----------------------------

function isWorking(argResident, argDay) {

    for (let position of positions) {
        if (month[argDay][position] == argResident) {
            return true;
        }
    }

    return false;
}
function nightYesterday(argResident, argDay) {

    //if there was night shift yesterday (ie. today is Sat or Sun)
    if (argDay % 7 == 5 || argDay % 7 == 6) {
        if (month[argDay-1].nightSr == argResident || month[argDay-1].nightJr == argResident) {
            return true;
        }
        else {
            return false;
        }
    }
}
function isAvailable(argResident, argDay) {

    if (!isWorking(argResident, argDay) && !nightYesterday(argResident, argDay)) return true;
    else return false;
}
function isEmpty(argPosition) {

    if (Object.keys(argPosition) == 0) {
        return true;
    }
    else {
        return false;
    }

}

//-----------------------------

function getResidents() {

    residents = [];
    var residentPool = document.querySelectorAll('input[name="resident"]:checked');
    var name;
    var PGY;

    for(let i=0;i<residentPool.length; i++) {

        name = residentPool[i].getAttribute('fname');
        PGY = residentPool[i].getAttribute('PGY');

        residents[i] = {};
        residents[i]['name'] = name;
        residents[i]['PGY'] = PGY;
        residents[i]['shifts'] = 0;
        residents[i]['consults'] = 0;
        residents[i]['weekends'] = 0;
        residents[i]['nights'] = 0;
        residents[i]['isEduChief'] = false;
    }

    //assign education chief (if any)
    var eduChiefResults = document.querySelectorAll('input[name="eduChief"]:checked');
    if(eduChiefResults.length>0) {
        var eduChiefName = eduChiefResults[0].value;
        for(let i=0;i<residents.length;i++) {
            if(residents[i]['name'] == eduChiefName) {
                eduChief = residents[i];
                residents[i].isEduChief = true;
            }
        }
    }
}
function getNumWeeks() {
    numWeeks = document.getElementById('num-weeks').value;
}
function scheduleScaffold() {

    var schedule = document.getElementById('schedule');
    schedule.innerHTML = "";
    var dayHTML;
    var weekHTML;
    
    //create table headers with the days of the week
    weekHTML = document.createElement('tr');
    weekHTML.appendChild(document.createElement('th'));
    for(let dayName of daysOfTheWeek) {
        dayHTML = document.createElement('th');
        dayHTML.innerHTML = dayName;
        weekHTML.appendChild(dayHTML);
    }
    schedule.appendChild(weekHTML);

    for (let week=0; week<numWeeks; week++) {
        
        weekHTML = document.createElement('tr');
        dayHTML = document.createElement('td');
        dayHTML.innerHTML = 'Week ' + (week+1);
        weekHTML.appendChild(dayHTML);
        for(let day=(week*7); day<(week*7)+7; day++){
            dayHTML = document.createElement('td');
            dayHTML.innerHTML = '';
            dayHTML.setAttribute('id', 'day'+ day);
            weekHTML.appendChild(dayHTML);
        }
        schedule.appendChild(weekHTML);
    }
}
function monthScaffold() {

    for (let week=0; week<numWeeks; week++) {
        for (let day=(week*7); day<(week*7)+7; day++) {
            month[day] = {};
            for (let position of positions) {
                month[day][position] = {};
            }
        }
    }
}
function assignTeams() {

    sortByPGYHigh(residents);

    blueTeam = [];
    redTeam = [];

    for (let resident of residents) {

        //assign one chief to each team, exclude not eduChief
        if (resident.PGY == 5) {
            if (resident != eduChief) {
                if (blueTeam.length <= redTeam.length) blueTeam.push(resident);
                else redTeam.push(resident);
            }
        }

        //even out team size
        else if (blueTeam.length < redTeam.length) blueTeam.push(resident);
        else if (blueTeam.length > redTeam.length) redTeam.push(resident);
        
        //each team should have at least one resident from each PGY
        else {
            if (resident.PGY != blueTeam[blueTeam.length-1].PGY) blueTeam.push(resident);
            else if (resident.PGY != redTeam[redTeam.length-1].PGY) redTeam.push(resident); 
            else blueTeam.push(resident); 
        }
    }
}
function populateMonth() {

    for (let week=0; week<numWeeks; week++) {

        //1. assign weekday chiefs
        for (let day=week*7; day<(week*7)+5; day++) {
            month[day].blueChief = assignShift(chooseChief(blueTeam));
            month[day].redChief = assignShift(chooseChief(redTeam));
        }

        //2. assign weekend seniors (always edu chief and one 4th year)
        for(let day=(week*7)+5; day<(week*7)+7; day++) {
            month[day].blueSr = assignWeekend(chooseSrWeekend(blueTeam, day, 'blue'));
            month[day].redSr = assignWeekend(chooseSrWeekend(redTeam, day, 'red'));
        }

        //3. assign night seniors (non weekend 4th year, 3rd year) and night juniors. No 24 hours shifts
        for (let day=(week*7)+4; day<(week*7)+6; day++) {
            month[day].nightSr = assignNight(chooseCallSr(residents, day));
            month[day].nightJr = assignNight(chooseCallJr(residents, day));
        }

        //4. assign remainder of shifts
        for (let day=week*7; day<(week*7)+7; day++) {

            //seniors
            if (isEmpty(month[day].blueSr)) month[day].blueSr = assignShift(chooseSr(blueTeam, day));
            if (isEmpty(month[day].redSr)) month[day].redSr = assignShift(chooseSr(redTeam, day));

            //juniors
            if (isEmpty(month[day].blueJr)) month[day].blueJr = assignShift(chooseJr(blueTeam, day));
            if (isEmpty(month[day].redJr)) month[day].redJr = assignShift(chooseJr(redTeam, day));

            //consult
            if (isEmpty(month[day].consult)) month[day].consult = assignConsult(chooseConsult(residents, day));
        }
    }
}
function outputMonth() {

    for(let week=0; week<numWeeks; week++) {

        for(let day=week*7; day<(week*7)+7; day++) {

            dayHTML = document.getElementById('day'+day);

            for (let position of positions) {
                dayHTML.innerHTML += position + ': ';
                if (!isEmpty(month[day][position])) dayHTML.innerHTML += month[day][position].name;
                dayHTML.innerHTML += '<br>';
            }
        }
    }
}

//-----------------------------

function sortByPGYHigh(argResidents) {

    argResidents.sort(function(low,high) {

        if (low.PGY == high.PGY) {

            return Math.random()-0.5;
        }

        return high.PGY - low.PGY;
    })
}
function sortByShifts(argResidents) {
    
    argResidents.sort(function(low,high) {

        if (low.shifts == high.shifts) {

            return low.PGY - high.PGY;
        }

        return low.shifts - high.shifts;
    })

}
function sortByConsults(argResidents) {

    argResidents.sort(function(low,high) {

        if (low.consults == high.consults) {

            return low.PGY - high.PGY;
        }

        return low.consults - high.consults;
    })
}
function sortByWeekends(argResidents) {

    argResidents.sort(function(low,high) {

        if (low.weekends == high.weekends) {

            return low.shifts - high.shifts;
        }

        return low.weekends - high.weekends;
    })
}
function sortByNights(argResidents) {

    argResidents.sort(function(low,high) {

        if (low.nights == high.nights) {

            return low.shifts - high.shifts;
        }

        return low.nights - high.nights;
    })
}

//-----------------------------

function canJr(argResident) {

    if (argResident.PGY < 3) return true;
    else return false;
}
function canSr(argResident) {

    if (argResident.PGY > 2) return true;
    else return false;
}
function canConsult(argResident) {
    
    if (argResident.PGY > 1 && argResident.PGY < 5) return true;
    else return false;
}
function canSrWeekend(argResident) {

    if (argResident.PGY == 4 || argResident.isEduChief) return true;
    else return false;
}
function canSrNight(argResident) {

    if (argResident.PGY == 3 || argResident.PGY == 4) return true;
    else return false;
}

//-----------------------------

function chooseChief (argTeam) {

        for(let i=0; i < argTeam.length; i++) {
            if(argTeam[i].PGY == 5) return argTeam[i];
        }
}
function chooseSr(argTeam, argDay) {

    sortByShifts(argTeam);

    for (let resident of argTeam) {
        if (canSr(resident) && isAvailable(resident, argDay)) return resident;
    }

    return {};
}
function chooseJr(argTeam, argDay) {

    sortByShifts(argTeam);

    for (let resident of argTeam) {
        if (canJr(resident) && isAvailable(resident, argDay)) return resident;
    }

    return {};
}
function chooseConsult(argTeam, argDay) {

    sortByConsults(argTeam);

    for (let resident of argTeam) {
        if (canConsult(resident) && isAvailable(resident, argDay)) return resident;
    }

    return {};

}
function chooseSrWeekend(argTeam, argDay, argTeamColor) {
			
    //if Sunday, keep weekend senior same as Sat
    if(argDay % 7 == 6) {
        if (argTeamColor == 'blue') return month[argDay-1].blueSr;
        else if (argTeamColor == 'red') return month[argDay-1].redSr;
        else return {};
    }

    //should education chief be weekend senior? (based on team + even/odd week)
    if(argTeamColor == 'blue' && (Math.trunc(argDay / 7)) % 2 == 0) return eduChief;
    if(argTeamColor == 'red' && (Math.trunc(argDay / 7)) % 2 == 1) return eduChief;

    //otherwise determine 4th year weekend senior
    sortByWeekends(argTeam);
    for (let resident of argTeam) {
        if (canSrWeekend(resident) && isAvailable(resident, argDay)) return resident;
    }

    return {};
}
function chooseCallSr(argTeam, argDay) {
			
    //find weekend 4th year (edu chief auto excluded from nights as a PGY5)
    var weekendPGY4 = {};
    if (month[argDay + 1].blueSr.PGY == 4) weekendPGY4 = month[argDay + 1].blueSr;
    else if (month[argDay + 1].redSr.PGY == 4) weekendPGY4 = month[argDay + 1].redSr;

    //find all possible night seniors
    var pool = [];
    for (let resident of argTeam) {
        if (canSrNight(resident) && resident != weekendPGY4) pool.push(resident);
    }

    //choose from all candidates, ok to work 2 nights in a row if needed
    sortByNights(pool);
    for (let resident of pool) {
        if (!isWorking(resident, argDay)) return resident;
    }

    return {};
}
function chooseCallJr(argTeam, argDay) {
			
    sortByNights(argTeam);

    //ok to work 2 nights in a row
    for (let resident of argTeam) {
        if (canJr(resident) && !isWorking(resident, argDay)) return resident;
    }

    return {};
}

//-----------------------------

function assignShift(argResident) {

    if(argResident != {}) argResident.shifts += 1;

    return argResident;
}
function assignConsult(argResident) {

    if (argResident != {}) argResident.consults += 1;
    
    return assignShift(argResident);
}
function assignWeekend(argResident) {
    
    if (argResident != {}) argResident.weekends += 1;
    
    return assignShift(argResident);
}
function assignNight(argResident) {

    if(argResident != {}) argResident.nights += 1;

    return assignWeekend(argResident);
}

//-----------------------------

function generateSchedule() {

    //create list of available residents
    getResidents();

    //get number of weeks to schedule
    getNumWeeks();

    //set up schedule scaffold
    scheduleScaffold();

    //create scaffold of one week data structure
    monthScaffold();
    
    //assign teams
    assignTeams();

    //assign positions one week at a time
    populateMonth();

    //output assignments to calender scaffold
    outputMonth();
}