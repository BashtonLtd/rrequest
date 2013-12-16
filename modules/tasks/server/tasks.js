/*
 * rrequest
 * http://www.rrequest.com/
 * (C) Copyright Bashton Ltd, 2013
 * 
 * This file is part of rrequest.
 * 
 * rrequest is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * rrequest is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with rrequest.  If not, see <http://www.gnu.org/licenses/>.
 * 
*/
var module;

Meteor.startup(function() {
	// register the tasks module
	Meteor.call('registerModule', {
		name: 'tasks',
		callback_enable: 'enable_tasks_module',
		callback_disable: 'disable_tasks_module',
		description: 'Allows other module to register tasks.'
	}, function(error, module_id) {
		if (!error) {

		}
	});

    module = Modules.findOne({name: 'tasks'});

    // this should only be set if module is active
    if (module.enabled) {
        var interval = setInterval(process_tasks, 31000);
    }
});

Meteor.methods({
	enable_tasks_module: function(args) {
		args = args || {};
		
	},

	disable_tasks_module: function(args) {
		args = args || {};

	}
});

process_tasks = function() {
    bound_create_event_log({level:'INFO', tags:['tasks'], message:'Starting to process tasks.'});
    tasks.process('tasks', 5, function(task, done){
        var status = global[task.data.callback](task.data.args);
        if (status == true) {
            done();
        } else {
            done('error running task.');
        }
    });
};

check_queue = function(jobname, queue, callback) {
    tasks.client.sort('q:jobs:' + queue
      , 'get', 'q:job:*->data'
      , function(err, jobs) {
        if (jobs.length > 0) {
            job_found = false;
            jobs.forEach(function (job) {
                var data = JSON.parse(job);
                if (data.title == jobname) {
                    job_found = true;
                }
            });
            if (job_found == false) {
                check_next_queue(jobname, queue, callback);
            }
        } else {
            check_next_queue(jobname, queue, callback);
        }
      }
    );
};

check_next_queue = function(jobname, queue, callback) {
    if (queue == 'delayed') {
        check_queue(jobname, 'inactive', callback);
    } else if (queue == 'inactive') {
        check_queue(jobname, 'active', callback);
    } else if (queue == 'active') {
        callback();
    }
}

job_exists = function(jobname, callback) {
    check_queue(jobname, 'delayed', callback);
};
