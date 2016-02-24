(function () {

    angular.module('app', ['angular-locker']);

    AppCtrl.$inject = ['$http', 'locker'];
    function AppCtrl($http, locker) {
        var vm = this;

        vm.sorting = 0;

        vm.saveData = locker.get('save');

        vm.isOwned = function(monster) {
            if (!vm.saveData) {
                return false;
            }

            return vm.saveData.indexOf(monster.id) >= 0;
        };

        vm.toggleMonster = function(monster) {
            vm.saveData = locker.get('save', []);

            if (vm.saveData.indexOf(monster.id) >= 0) {
                vm.saveData.splice(vm.saveData.indexOf(monster.id), 1);
            } else {
                vm.saveData.push(monster.id);
            }

            locker.put('save', vm.saveData);
        };

        vm.owned = function(type) {
            if (!vm.monsters) {
                return '?';
            }

            return vm.monsters.filter(function(monster) {
                return vm.isOwned(monster) && ((type && monster.type == type) || !type);
            }).length;
        };

        vm.ownedPercentage = function(type) {
            return Math.ceil(vm.owned(type) * 100 / vm.total(type));
        };

        vm.total = function(type) {
            return vm.monsters.filter(function(monster) {
                if (!type) {
                    return true;
                }

                return monster.type == type;
            }).length;
        };

        vm.load = function() {
            vm.saveData = vm.loadData;

            locker.put('save', vm.loadData.split(',').map(function(id) {
                return parseInt(id);
            }));

            vm.loadData = null;
        };

        $http.get('/monsters.json').then(function(res) {
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
