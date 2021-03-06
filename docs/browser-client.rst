Browser client
==============

Getting started
---------------

The first step in getting started with any piece of software is installation,
but "installation" is a misnomer when developing web applications. Browsers use
JavaScript (JS) as their "native" programming language, but JS programs are
never truly installed because they cannot alter or extend the browsers
themselves. Instead, JS programs are downloaded according to the contents of
webpages, and they run in "disposable" sandboxed environments that exist only
while the webpages are open. Thus, the "installation" of QM's browser client
into a webpage is as simple as adding a single line of HTML:

.. code-block:: html

    <script src="https://www.qmachine.org/qm.js"></script>

When the webpage loads, its JS environment will contain a ``QM`` object that
will allow other programs to submit jobs to and volunteer to execute jobs from
the official QM servers -- for free!

.. note::

    Modern web browsers can often be programmed "externally" to the webpages
    themselves. For example, browsers may load custom user scripts, or they may
    be scripted by external programs to run unit tests. These capabilities are
    not leveraged in any way by the QM browser client. It may or may not run
    correctly within Web Worker contexts, but the client described in this
    manual expects to run within the "ordinary" webpage context of a modern web
    browser, unassisted by applets, extensions, plugins, etc.

For the hardcore software engineers out there, QM's browser client is available
for "installation" with Bower_:

.. code-block:: bash

    $ bower install qm

.. Or, use `bower install qmachine/qm-browser-client` if you're really daring!


Basic use
---------

Submitting jobs
~~~~~~~~~~~~~~~

See http://www.biomedcentral.com/1471-2105/15/176#sec4 for now.


Using volunteers' machines
~~~~~~~~~~~~~~~~~~~~~~~~~~

Two convenience functions, ``QM.start`` and ``QM.stop``, are provided in order
to control a simple non-blocking (asynchronous) event loop externally. The loop
"fires" approximately once per second, and if appropriate, it runs the
``QM.volunteer`` function. This internal event loop is neither externally
configurable nor necessary for using QM -- it simply wraps the ``QM.volunteer``
function for convenience, rather than forcing application code to implement its
own non-blocking loop.


Advanced use
------------

QM's browser client leverages asynchronous variables ("avars") extensively to
manage concurrency issues in an object-oriented way, and this programming model
is provided by Quanah_ and its JavaScript library. Tutorials for advanced use
are forthcoming, but they will essentially discuss working with avars. For now,
the best reference on Quanah is its `manual <https://quanah.readthedocs.org>`_.


.. ----------------------------
.. include:: external-links.rst

