(function () {

    angular.module('app', ['angular-locker']);

    AppCtrl.$inject = ['$http', 'locker'];
    function AppCtrl($http, locker) {
        var vm = this;

        vm.totalSteps = 34;
        vm.sorting = locker.get('sorting', 0);
        vm.saveData = locker.get('save');
        vm.displayOwnedMonsters = locker.get('displayOwnedMonsters', true);
        vm.displayFinishedZones = locker.get('displayFinishedZones', true);
        vm.displayFinishedSteps = locker.get('displayFinishedSteps', true);
        // Initialisation de la variable selectedType
        vm.selectedType = '';

        // Fonction pour filtrer les monstres par type
        vm.filterByType = function(monster) {
            return vm.selectedType === '' || monster.type === vm.selectedType;
        };

        vm.isOwned = function(monster) {
            if (!vm.saveData || !monster) {
                return false;
            }

            return vm.saveData.indexOf(monster.id) >= 0;
        };

        vm.toggleMonster = function(monster, val) {
            vm.saveData = locker.get('save', []);

            if (vm.saveData.indexOf(monster.id) >= 0) {
                if (angular.isUndefined(val) || val === false) {
                    vm.saveData.splice(vm.saveData.indexOf(monster.id), 1);
                }
            } else {
                if (angular.isUndefined(val) || val === true) {
                    vm.saveData.push(monster.id);
                }
            }

            locker.put('save', vm.saveData);
        };

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
            vm.saveData = vm.loadData;

            locker.put('save', vm.loadData.split(',').map(function(id) {
                return parseInt(id);
            }));

            vm.loadData = null;
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
            var newVal = true;

            if (vm.owned(false, false, step) == vm.total(false, false, step)) {
                newVal = false;
            }

            vm.monsters.map(function(monster) {
                if (monster.step == step) {
                    vm.toggleMonster(monster, newVal);
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

        // Fonction pour charger les monstres
        vm.loadMonsters = function() {
            $http.get('monsters.json').then(function(res) {
                vm.monsters = res.data;
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
        };
    
        // Appelez cette fonction pour initialiser les monstres
        vm.loadMonsters();
    
        vm.resetAll = function() {
            if (confirm('Dernière chance !')) {
                locker.clean();
    
                // Réinitialisez vos variables ici
                vm.sorting = 0;
                vm.saveData = null;
                vm.displayOwnedMonsters = true;
                vm.displayFinishedZones = true;
                vm.displayFinishedSteps = true;
                vm.zones = {};
                vm.steps = [];
                vm.monsters = [];
    
                $('#saveModal').modal('hide');
    
                // Rechargez les monstres après la réinitialisation
                vm.loadMonsters();
            }
        };

        $http.get('monsters.json').then(function(res) {
            vm.monsters = res.data;

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
