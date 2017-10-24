<?php
    if(isset($_GET)) {
        $query_url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize=full&symbol={$symbol}&apikey=XJPOXPVZNXYML3L2";
        $content = file_get_contents($query_url);
        
    }
    else {
        echo json_encode(array('error' => 'only suport GET operation.'));
    }
?>