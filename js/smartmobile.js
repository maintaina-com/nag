/**
 * Base smartmobile application logic for Nag.
 *
 * Copyright 2011-2012 Horde LLC (http://www.horde.org/)
 *
 * See the enclosed file COPYING for license information (GPL). If you
 * did not receive this file, see http://www.horde.org/licenses/gpl.
 *
 * @author   Michael J. Rubinsky <mrubinsk@horde.org>
 * @category Horde
 * @license  http://www.horde.org/licenses/gpl GPL
 * @package  Nag
 */
var NagMobile = {

    toggleComplete: function(d)
    {
        var parsed = d.options.parsedUrl;

        HordeMobile.doAction(
            'smartmobileToggle',
            {
                task: parsed.params.task_id,
                tasklist: parsed.params.tasklist
            },
            function(r) { NagMobile.toggleCompleteCallback(r, d.options.data) }
        );
    },

    toggleCompleteCallback: function(r, elt)
    {
        switch (r.data) {
        case 'complete':
            if (Nag.conf.showCompleted == 'incomplete' ||
                Nag.conf.showCompleted == 'future-incomplete') {
                // Hide the task
                elt.parent().remove();
            } else {
                elt.jqmData('icon', 'check')
                    .find('span.ui-icon')
                    .removeClass('ui-icon-nag-unchecked')
                    .addClass('ui-icon-check');
            }
            break;

        default:
            if (Nag.conf.showCompleted == 'complete') {
                // Hide the task
                elt.parent().remove();
            } else {
                elt.jqmData('icon', 'minus')
                    .find('span.ui-icon')
                    .removeClass('ui-icon-check')
                    .addClass('ui-icon-nag-unchecked');
            }
        }
    },

    getTask: function(d)
    {
        var parsed = d.options.parsedUrl;
        HordeMobile.changePage('nag-task-view', d);

        HordeMobile.doAction(
            'getTask',
            {
                task: parsed.params.task_id,
                tasklist: parsed.params.tasklist
            },
            NagMobile.getTaskCallback
        );
    },

    getTaskCallback: function(r)
    {
        var task = r.task,
            f = $('form')[0];

        f.reset();
        $("#task_title").val(task.n);
        $("#task_desc").val(task.de);
        $("#task_assignee").val(task.as);
        $("task_private").prop("checked", task.pr).checkboxradio("refresh");
        // @TODO: Style differently if overdue?
        $("#task_due").val(Date.parse(task.dd).toString('yyyy-MM-dd'));
        $("#task_start").val(task.s);
        $("#task_priority").val(task.pr);
        $("#task_completed").prop("checked", task.cp).checkboxradio("refresh");
        $("#task_estimate").val(task.e);
    },

    toLists: function(d)
    {
        HordeMobile.changePage('nag-lists', d);
        HordeMobile.doAction(
            'getTaskLists',
            {},
            NagMobile.getTasklistsCallback
        );
    },

    getTasklistsCallback: function(r)
    {
        var list = $('#nag-lists :jqmData(role="listview")');

        list.empty();

        $.each(r.tasklists, function(i, l) {
            NagMobile.insertTasklist(list, l);
        });

        list.listview('refresh');
    },

    insertTasklist: function(el, l)
    {
        var url = HordeMobile.createUrl('nag-list', { tasklist: l.id });

        list = $('<li>').append(
            $('<a>').attr({ href: url })
                .addClass('nag-tasklist')
                .append($('<h3>').text(l.name))
        );

        el.append(list);
    },

    toList: function(d)
    {
        var params = d.options.parsedUrl.params;

        HordeMobile.doAction(
            'listTasks',
            { tasklist: params.tasklist },
            NagMobile.listTasksCallback
        );
        HordeMobile.changePage('nag-list', d);
    },

    listTasksCallback: function(r)
    {
        var list = $('#nag-list :jqmData(role="listview")');

        list.empty();

        $.each(r.tasks, function(i, t) {
            NagMobile.insertTask(list, t);
        });

        list.listview('refresh');
    },

    /**
     * Insert task into the view.
     */
    insertTask: function(l, t)
    {
        var params = {
            task_id: t.id,
            tasklist: t.l
        };

        l.append($('<li>').jqmData('icon', t.cp ? 'check' : 'nag-unchecked')
            .append(
                $('<a>').attr({
                    href: HordeMobile.createUrl('nag-task-view', params)
                }).addClass('nag-task')
                .append(
                    $('<h3>').text(t.n)
                ).append(
                    $('<p>').addClass('ui-li-aside')
                        .text(t.dd)
                ).append(
                    $('<p>').text(t.de)
                )
            ).append(
                $('<a>').attr({
                    href: HordeMobile.createUrl('nag-toggle', params)
                })
            ));
    },

    toPage: function(e, data)
    {
        switch (data.options.parsedUrl.view) {
        case 'nag-list':
            NagMobile.toList(data);
            e.preventDefault();
            break;

        case 'nag-task-view':
            NagMobile.getTask(data);
            e.preventDefault();
            break;

        case 'nag-lists':
            NagMobile.toLists(data);
            e.preventDefault();
            break;

        case 'nag-toggle':
            NagMobile.toggleComplete(data);
            e.preventDefault();
            break;
        }
    },

    onDocumentReady: function()
    {
        $(document).bind('pagebeforechange', NagMobile.toPage);

        /* Capture task completed clicks to add the current LI element to
         * the page change data. */
        $('#nag-list :jqmData(role="listview")').on('click', 'li', function(e) {
            var a = $(e.target).closest('a[href^="#nag-toggle"]');
            if (a.length) {
                $.mobile.changePage(a.attr('href'), { data: $(e.currentTarget) });
                return false;
            }
        });
    }

};

$(NagMobile.onDocumentReady);
