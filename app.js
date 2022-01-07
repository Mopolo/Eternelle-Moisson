(function () {

    angular.module('app', ['angular-locker']);

    AppCtrl.$inject = ['$http', 'locker'];
    function AppCtrl($http, locker) {
        var vm = this;

        vm.simultaneous = locker.get('simultaneous');
        vm.totalSteps = 34;
        vm.sorting = locker.get('sorting', 0);
        vm.saveData = locker.get('save');
        vm.displayOwnedMonsters = locker.get('displayOwnedMonsters', true);
        vm.displayFinishedZones = locker.get('displayFinishedZones', true);
        vm.displayFinishedSteps = locker.get('displayFinishedSteps', true);

        vm.isOwned = function(monster) {
            if (!vm.saveData || !monster) {
                return false;
            }

            return vm.saveData.find(el => el[0] === monster.id) && vm.saveData.find(el => el[0] === monster.id)[1]  >= vm.simultaneous;
        };

        vm.saveMonster = function(monster, val) {
            vm.saveData = locker.get('save', []);
            if (vm.saveData.find(savedMonster => savedMonster[0] === monster.id)) {
                vm.saveData[vm.saveData.findIndex(savedMonster => savedMonster[0] === monster.id)][1] = monster.owned;
            } else {
                vm.saveData.push([monster.id, monster.owned]);
            }

            locker.put('save', vm.saveData);
        };

        vm.increase = function(monster) {
            monster.owned++;
            vm.saveMonster(monster);
        };

        vm.decrease = function(monster) {
            if(monster.owned > 0) {
                monster.owned--;
            }
            vm.saveMonster(monster);
        };

        vm.saveSimultaneous = function () {
            locker.put('simultaneous', vm.simultaneous)
        }

        vm.owned = function(type, zone, step) {
            if (!vm.monsters) {
                return '?';
            }

            return vm.monsters.filter(function(monster) {
                if (!vm.isOwned(monster)) {
                    return false;
                }

                if (!type && !zone && !step) {
                    return true;
                }

                if (type && monster.type == type) {
                    return true;
                }

                if (zone && monster.zones.indexOf(zone) >= 0) {
                    return true;
                }

                if (step && monster.step == step) {
                    return true;
                }

                return false;
            }).length;
        };

        vm.ownedPercentage = function(type, zone, step) {
            return Math.ceil(vm.owned(type, zone, step) * 100 / vm.total(type, zone, step)) || 0;
        };

        vm.total = function(type, zone, step) {
            if (!vm.monsters) {
                return '?';
            }

            return vm.monsters.filter(function(monster) {
                if (type) {
                    return monster.type == type;
                }

                if (zone) {
                    return monster.zones.indexOf(zone) >= 0;
                }

                if (step) {
                    return monster.step == step;
                }

                return true;
            }).length;
        };

        vm.load = function() {
            locker.put('save', vm.loadData.match(/\d+,\d+/gm).map(function(id) {
                return [+id.split(',')[0],+id.split(',')[1]];
            }));

            vm.saveData = locker.get('save');
        };

        vm.toggleZone = function(zone) {
            var newVal = true;

            if (vm.owned(false, zone) == vm.total(false, zone)) {
                newVal = false;
            }

            vm.monsters.map(function(monster) {
                if (monster.zones.indexOf(zone) >= 0) {
                    vm.toggleMonster(monster, newVal);
                }
            });
        };

        vm.toggleStep = function(step) {
            var newVal = vm.simultaneous;

            if (vm.owned(false, false, step) == vm.total(false, false, step)) {
                newVal = 0;
            }

            vm.monsters.map(function(monster) {
                if (monster.step == step) {
                    monster.owned = newVal;
                    vm.saveMonster(monster);
                }
            });
        };

        vm.completedSteps = function() {
            if (!vm.monsters) {
                return '??';
            }

            return vm.monsters.map(function(monster) {
                return monster.step;
            }).sort().filter(function(step, index, steps) {
                return index == steps.indexOf(step);
            }).filter(function(step) {
                return vm.ownedPercentage(false, false, step) == 100;
            }).length;
        };

        vm.completedStepsPercentage = function() {
            return Math.ceil(vm.completedSteps() * 100 / vm.totalSteps);
        };

        vm.chooseSorting = function(sorting) {
            vm.sorting = sorting;

            locker.put('sorting', sorting);
        };


        vm.toggleOwnedMonsters = function() {
            locker.put('displayOwnedMonsters', vm.displayOwnedMonsters);
        }

        vm.toggleFinishedZones = function() {
            locker.put('displayFinishedZones', vm.displayFinishedZones);
        }

        vm.toggleFinishedSteps = function() {
            locker.put('displayFinishedSteps', vm.displayFinishedSteps);
        }

        vm.resetAll = function() {
            if (confirm('Dernière chance !')) {
                locker.clean();

                vm.sorting = 0;
                vm.saveData = null;
                vm.displayOwnedMonsters = true;
                vm.displayFinishedZones = true;
                vm.displayFinishedSteps = true;
                vm.zones = {};
                vm.steps = [];
                vm.monsters = [];

                $('#saveModal').modal('hide');
            }
        };

        $http.get('monsters.json').then(function(res) {
            vm.monsters = res.data;
            vm.monsters.forEach(monster => {
                monster.owned = vm.saveData?.find(el => el[0] === monster.id) ? vm.saveData.find(el => el[0] === monster.id)[1] : 0
            })

            vm.zones = {};
            vm.steps = [];

            angular.forEach(vm.monsters, function(monster) {
                angular.forEach(monster.zones, function(zone) {
                    if (angular.isUndefined(vm.zones[zone])) {
                        vm.zones[zone] = [];
                    }

                    vm.zones[zone].push(monster);
                });

                if (angular.isUndefined(vm.steps[monster.step])) {
                    vm.steps[monster.step] = [];
                }

                vm.steps[monster.step].push(monster);
            });
        });
    }

    angular.module('app')
        .controller('AppCtrl', AppCtrl);

}());
