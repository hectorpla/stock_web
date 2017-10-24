<?php
    if(isset($_GET)) {
        $query = $_GET['search'];
        $content = file_get_contents("http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input={$query}");
        echo $content;
    }
    else {
        echo json_encode(array('error' => 'only suport GET operation.'));
    }
?>